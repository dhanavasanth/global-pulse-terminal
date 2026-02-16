"""
Active Trades Agent
Identifies high-activity options via OI (Open Interest) and volume comparisons.
Ranks "hot" options for potential trade opportunities.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class ActiveTradesAgent:
    """
    Scans options chains for unusual activity based on OI and volume.
    Computes activity scores and flags buildup/unwinding signals.
    """

    # Default thresholds (adjustable per index)
    THRESHOLDS = {
        "nifty50": {"min_oi": 50000, "min_volume": 20000},
        "banknifty": {"min_oi": 30000, "min_volume": 15000},
        "sensex": {"min_oi": 10000, "min_volume": 5000},
    }

    # Activity score weights
    OI_WEIGHT = 0.6
    VOLUME_WEIGHT = 0.4

    def __init__(self, ollama_client=None, cycle_logger=None):
        self.ollama = ollama_client
        self.logger = cycle_logger

    async def run(self, shared_state) -> Dict[str, Any]:
        """Identify high-activity options from the current chain."""
        start = time.time()
        options_chain = shared_state.get("options_chain", [])
        cycle_id = shared_state.cycle_id or "unknown"

        if not options_chain:
            return {
                "active_options": [],
                "summary": "No options chain data available.",
                "duration_ms": 0,
            }

        # 1. Store current OI/volume to history (for rolling averages)
        if self.logger:
            self.logger.log_oi_data(cycle_id, options_chain)

        # 2. Compute activity scores with historical comparison
        scored_options = self._score_options(options_chain)

        # 3. Filter and rank by activity
        high_activity = [o for o in scored_options if o["activity_label"] == "high"]
        medium_activity = [o for o in scored_options if o["activity_label"] == "medium"]

        # Sort by activity score descending
        high_activity.sort(key=lambda x: x["activity_score"], reverse=True)
        medium_activity.sort(key=lambda x: x["activity_score"], reverse=True)

        # Top 5 from each
        top_active = high_activity[:5]
        top_medium = medium_activity[:5]

        # 4. Detect OI buildup/unwinding
        buildup_signals = self._detect_buildup(scored_options)

        # 5. PCR (Put-Call Ratio) analysis
        pcr = self._compute_pcr(options_chain)

        # 6. Max Pain calculation
        max_pain = self._compute_max_pain(options_chain)

        result = {
            "top_active": top_active,
            "medium_activity": top_medium,
            "buildup_signals": buildup_signals,
            "pcr": pcr,
            "max_pain": max_pain,
            "total_scanned": len(options_chain),
            "high_count": len(high_activity),
            "medium_count": len(medium_activity),
            "timestamp": datetime.now().isoformat(),
            "duration_ms": (time.time() - start) * 1000,
        }

        # AI analysis
        if self.ollama and self.ollama.is_available:
            analysis = self._analyze_with_llm(result)
            result["ai_analysis"] = analysis

        shared_state.set("active_trades", result)
        return result

    def _score_options(self, options: List[Dict]) -> List[Dict]:
        """
        Score each option based on OI and volume vs thresholds and averages.
        Activity Score = 0.6 * (OI/avg_OI) + 0.4 * (volume/avg_volume)
        """
        scored = []

        # Group by index for per-index averages
        by_index: Dict[str, List[Dict]] = {}
        for opt in options:
            idx = opt.get("index", "nifty50")
            by_index.setdefault(idx, []).append(opt)

        for idx, idx_options in by_index.items():
            # Compute averages for this index's current chain
            all_oi = [o.get("oi", 0) for o in idx_options if o.get("oi", 0) > 0]
            all_vol = [o.get("volume", 0) for o in idx_options if o.get("volume", 0) > 0]

            avg_oi = np.mean(all_oi) if all_oi else 1
            avg_vol = np.mean(all_vol) if all_vol else 1

            thresholds = self.THRESHOLDS.get(idx, self.THRESHOLDS["nifty50"])

            for opt in idx_options:
                oi = opt.get("oi", 0)
                volume = opt.get("volume", 0)
                change_oi = opt.get("change_oi", 0)

                # Historical comparison (from DB if available)
                hist_avg_oi = avg_oi
                hist_avg_vol = avg_vol
                if self.logger:
                    history = self.logger.get_oi_history(
                        opt.get("strike", 0), opt.get("type", "CE"), limit=5
                    )
                    if history:
                        hist_ois = [h["oi"] for h in history if h["oi"]]
                        hist_vols = [h["volume"] for h in history if h["volume"]]
                        if hist_ois:
                            hist_avg_oi = np.mean(hist_ois)
                        if hist_vols:
                            hist_avg_vol = np.mean(hist_vols)

                # Activity score
                oi_ratio = oi / hist_avg_oi if hist_avg_oi > 0 else 0
                vol_ratio = volume / hist_avg_vol if hist_avg_vol > 0 else 0
                activity_score = self.OI_WEIGHT * oi_ratio + self.VOLUME_WEIGHT * vol_ratio

                # Classification
                if activity_score > 1.5 and oi > thresholds["min_oi"]:
                    label = "high"
                elif activity_score > 1.0 and oi > thresholds["min_oi"] * 0.5:
                    label = "medium"
                else:
                    label = "low"

                # OI change analysis
                oi_change_pct = (change_oi / oi * 100) if oi > 0 else 0

                scored.append({
                    **opt,
                    "activity_score": round(activity_score, 3),
                    "activity_label": label,
                    "oi_ratio": round(oi_ratio, 2),
                    "vol_ratio": round(vol_ratio, 2),
                    "oi_change_pct": round(oi_change_pct, 2),
                    "comparison": f"{oi_ratio:.1f}x avg OI, {vol_ratio:.1f}x avg volume",
                })

        return scored

    def _detect_buildup(self, scored_options: List[Dict]) -> List[Dict]:
        """
        Detect OI buildup or unwinding signals.
        - OI increase + price increase = Long buildup (bullish)
        - OI increase + price decrease = Short buildup (bearish)
        - OI decrease + price increase = Short covering (bullish)
        - OI decrease + price decrease = Long unwinding (bearish)
        """
        signals = []
        for opt in scored_options:
            change_oi = opt.get("change_oi", 0)
            oi_change_pct = opt.get("oi_change_pct", 0)

            if abs(oi_change_pct) < 5:  # Skip insignificant changes
                continue

            if change_oi > 0 and oi_change_pct > 20:
                signal_type = "buildup"
                if opt.get("type") == "CE":
                    interpretation = "Call OI buildup — bullish signal"
                else:
                    interpretation = "Put OI buildup — bearish signal / hedging"
            elif change_oi < 0 and oi_change_pct < -20:
                signal_type = "unwinding"
                if opt.get("type") == "CE":
                    interpretation = "Call OI unwinding — bearish signal"
                else:
                    interpretation = "Put OI unwinding — bullish signal"
            else:
                continue

            signals.append({
                "strike": opt.get("strike"),
                "type": opt.get("type"),
                "index": opt.get("index"),
                "signal": signal_type,
                "oi_change": change_oi,
                "oi_change_pct": oi_change_pct,
                "interpretation": interpretation,
            })

        return signals[:10]  # Top 10 signals

    @staticmethod
    def _compute_pcr(options: List[Dict]) -> Dict[str, float]:
        """
        Put-Call Ratio based on OI and volume.
        PCR > 1 = bearish (more puts), PCR < 0.7 = bullish (more calls)
        """
        pcr_by_index: Dict[str, Dict] = {}

        for opt in options:
            idx = opt.get("index", "nifty50")
            if idx not in pcr_by_index:
                pcr_by_index[idx] = {"put_oi": 0, "call_oi": 0, "put_vol": 0, "call_vol": 0}

            if opt.get("type") == "PE":
                pcr_by_index[idx]["put_oi"] += opt.get("oi", 0)
                pcr_by_index[idx]["put_vol"] += opt.get("volume", 0)
            else:
                pcr_by_index[idx]["call_oi"] += opt.get("oi", 0)
                pcr_by_index[idx]["call_vol"] += opt.get("volume", 0)

        result = {}
        for idx, data in pcr_by_index.items():
            oi_pcr = data["put_oi"] / data["call_oi"] if data["call_oi"] > 0 else 0
            vol_pcr = data["put_vol"] / data["call_vol"] if data["call_vol"] > 0 else 0
            result[idx] = {
                "oi_pcr": round(oi_pcr, 3),
                "volume_pcr": round(vol_pcr, 3),
                "signal": "bearish" if oi_pcr > 1.2 else ("bullish" if oi_pcr < 0.7 else "neutral"),
            }

        return result

    @staticmethod
    def _compute_max_pain(options: List[Dict]) -> Dict[str, Any]:
        """
        Max Pain = strike where total loss for option buyers is maximum.
        This is the strike where sum of ITM call + put values is minimized.
        """
        result = {}
        by_index: Dict[str, Dict[float, Dict]] = {}

        for opt in options:
            idx = opt.get("index", "nifty50")
            strike = opt.get("strike", 0)
            if idx not in by_index:
                by_index[idx] = {}
            if strike not in by_index[idx]:
                by_index[idx][strike] = {"ce_oi": 0, "pe_oi": 0}
            if opt.get("type") == "CE":
                by_index[idx][strike]["ce_oi"] = opt.get("oi", 0)
            else:
                by_index[idx][strike]["pe_oi"] = opt.get("oi", 0)

        for idx, strikes_data in by_index.items():
            strikes = sorted(strikes_data.keys())
            min_pain = float("inf")
            max_pain_strike = 0

            for test_strike in strikes:
                total_pain = 0
                for strike, data in strikes_data.items():
                    # Call buyers' loss
                    if strike < test_strike:
                        total_pain += (test_strike - strike) * data["ce_oi"]
                    # Put buyers' loss
                    if strike > test_strike:
                        total_pain += (strike - test_strike) * data["pe_oi"]

                if total_pain < min_pain:
                    min_pain = total_pain
                    max_pain_strike = test_strike

            result[idx] = {
                "max_pain_strike": max_pain_strike,
                "total_pain_value": min_pain,
            }

        return result

    def _analyze_with_llm(self, data: Dict) -> Dict:
        """Use Llama3.1 for qualitative analysis of active trades."""
        prompt = self.ollama.build_agent_prompt(
            agent_name="Active Trades Analyst",
            steps=[
                f"Analyze top {len(data.get('top_active', []))} high-activity options",
                "Check if high OI is near support/resistance (if known)",
                "Analyze buildup signals for directional bias",
                f"Review PCR data: {data.get('pcr', {})}",
                f"Max pain levels: {data.get('max_pain', {})}",
                "Suggest entry based on activity + max pain convergence",
            ],
            data={
                "top_active": data.get("top_active", [])[:3],
                "buildup_signals": data.get("buildup_signals", [])[:3],
                "pcr": data.get("pcr", {}),
                "max_pain": data.get("max_pain", {}),
            },
            output_fields=["top_picks", "directional_bias", "entry_suggestions", "warnings"],
        )
        return self.ollama.chat_json(prompt)
