"""
Decision Maker Agent
Synthesizes all agent outputs to produce actionable buy/sell/hold recommendations.
Uses Llama3.1 for multi-factor reasoning and alignment checking.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class DecisionMakerAgent:
    """
    Aggregates insights from all agents and produces trading recommendations.
    Checks alignment across sentiment, technicals, risk, and active trades.
    """

    # Confidence thresholds
    HIGH_CONFIDENCE = 0.7
    MEDIUM_CONFIDENCE = 0.5

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client

    async def run(self, shared_state) -> Dict[str, Any]:
        """Synthesize all agent outputs and produce recommendations."""
        start = time.time()

        # Collect all agent outputs
        sentiment = shared_state.get("sentiment", {})
        technicals = shared_state.get("technicals", {})
        risk_metrics = shared_state.get("risk_metrics", {})
        active_trades = shared_state.get("active_trades", {})
        ltp = shared_state.get("ltp", {})
        vix = shared_state.get("vix", 15)

        # 1. Rule-based alignment check
        alignment = self._check_alignment(sentiment, technicals, risk_metrics, active_trades)

        # 2. Generate recommendations (code-based)
        recommendations = self._generate_recommendations(
            alignment, sentiment, technicals, risk_metrics, active_trades, ltp, vix
        )

        # 3. LLM-enhanced reasoning
        if self.ollama and self.ollama.is_available:
            llm_decision = self._reason_with_llm(
                sentiment, technicals, risk_metrics, active_trades, ltp, vix
            )
            recommendations["ai_reasoning"] = llm_decision

        result = {
            "recommendations": recommendations.get("actions", []),
            "primary_action": recommendations.get("primary", {}),
            "alignment": alignment,
            "confidence": recommendations.get("confidence", 0),
            "market_regime": recommendations.get("market_regime", "unknown"),
            "ai_reasoning": recommendations.get("ai_reasoning", {}),
            "disclaimer": "⚠️ This is AI-generated analysis for educational purposes only. Not financial advice. Paper trading only.",
            "timestamp": datetime.now().isoformat(),
            "duration_ms": (time.time() - start) * 1000,
        }

        shared_state.set("decision", result)
        return result

    def _check_alignment(
        self, sentiment: Dict, technicals: Dict, risk: Dict, active: Dict
    ) -> Dict[str, Any]:
        """
        Check alignment across all signals.
        Aligned signals = higher confidence.
        """
        signals = {"bullish": 0, "bearish": 0, "neutral": 0}

        # Sentiment signal
        sent_score = sentiment.get("sentiment_score", 0)
        if sent_score > 0.2:
            signals["bullish"] += 1
        elif sent_score < -0.2:
            signals["bearish"] += 1
        else:
            signals["neutral"] += 1

        # Technical signal (per index)
        tech_indices = technicals.get("indices", {})
        for idx_name, idx_data in tech_indices.items():
            if not isinstance(idx_data, dict):
                continue
            trend = idx_data.get("trend", "sideways")
            rsi_signal = idx_data.get("rsi_signal", "neutral")

            if trend == "upward" or rsi_signal in ["bullish", "oversold"]:
                signals["bullish"] += 1
            elif trend == "downward" or rsi_signal in ["bearish", "overbought"]:
                signals["bearish"] += 1
            else:
                signals["neutral"] += 1

        # Risk signal (inverse — high risk = bearish)
        risk_label = risk.get("risk_label", "medium")
        if risk_label == "low":
            signals["bullish"] += 1
        elif risk_label == "high":
            signals["bearish"] += 1
        else:
            signals["neutral"] += 1

        # Active trades PCR signal
        pcr = active.get("pcr", {})
        for idx_pcr in pcr.values():
            if isinstance(idx_pcr, dict):
                pcr_signal = idx_pcr.get("signal", "neutral")
                if pcr_signal == "bullish":
                    signals["bullish"] += 1
                elif pcr_signal == "bearish":
                    signals["bearish"] += 1
                else:
                    signals["neutral"] += 1

        total = sum(signals.values()) or 1
        dominant = max(signals, key=signals.get)
        alignment_pct = signals[dominant] / total

        return {
            "signals": signals,
            "dominant": dominant,
            "alignment_percentage": round(alignment_pct * 100, 1),
            "is_aligned": alignment_pct >= 0.6,
        }

    def _generate_recommendations(
        self,
        alignment: Dict,
        sentiment: Dict,
        technicals: Dict,
        risk: Dict,
        active: Dict,
        ltp: Dict,
        vix: float,
    ) -> Dict[str, Any]:
        """Generate rule-based trading recommendations."""
        actions = []
        dominant = alignment.get("dominant", "neutral")
        is_aligned = alignment.get("is_aligned", False)
        risk_label = risk.get("risk_label", "medium")

        # Market regime classification
        if vix > 25:
            regime = "high_volatility"
        elif vix > 18:
            regime = "moderate_volatility"
        elif vix < 13:
            regime = "low_volatility"
        else:
            regime = "normal"

        # Get top active options
        top_active = active.get("top_active", [])
        max_pain = active.get("max_pain", {})

        # Decision logic
        confidence = 0.3  # Base

        if is_aligned and risk_label != "high":
            confidence += 0.3

            if dominant == "bullish":
                # Look for call buying opportunities
                for opt in top_active[:3]:
                    if opt.get("type") == "CE":
                        actions.append({
                            "action": "BUY",
                            "type": "CALL",
                            "index": opt.get("index", "nifty50"),
                            "strike": opt.get("strike"),
                            "reason": f"Bullish alignment + high activity ({opt.get('comparison', '')})",
                            "activity_score": opt.get("activity_score", 0),
                        })

                if not actions:
                    nifty_tech = technicals.get("indices", {}).get("nifty50", {})
                    actions.append({
                        "action": "BUY",
                        "type": "CALL",
                        "index": "nifty50",
                        "strike": nifty_tech.get("support", ltp.get("nifty50", 25000)),
                        "reason": "Bullish alignment, buy near support",
                    })

            elif dominant == "bearish":
                for opt in top_active[:3]:
                    if opt.get("type") == "PE":
                        actions.append({
                            "action": "BUY",
                            "type": "PUT",
                            "index": opt.get("index", "nifty50"),
                            "strike": opt.get("strike"),
                            "reason": f"Bearish alignment + high activity ({opt.get('comparison', '')})",
                            "activity_score": opt.get("activity_score", 0),
                        })

                if not actions:
                    nifty_tech = technicals.get("indices", {}).get("nifty50", {})
                    actions.append({
                        "action": "BUY",
                        "type": "PUT",
                        "index": "nifty50",
                        "strike": nifty_tech.get("resistance", ltp.get("nifty50", 25000)),
                        "reason": "Bearish alignment, buy near resistance",
                    })

        elif regime == "high_volatility":
            confidence = max(confidence, 0.4)
            actions.append({
                "action": "HEDGE",
                "type": "STRADDLE",
                "index": "nifty50",
                "reason": f"High VIX ({vix}) — straddle for volatility play",
            })

        else:
            confidence = 0.2
            actions.append({
                "action": "HOLD",
                "type": "WAIT",
                "reason": "Signals not aligned or risk too high. Wait for clearer setup.",
            })

        # Adjust confidence based on risk
        if risk_label == "high":
            confidence *= 0.7
        elif risk_label == "low":
            confidence = min(confidence * 1.2, 0.95)

        # Primary recommendation
        primary = actions[0] if actions else {"action": "HOLD", "reason": "No clear signal"}

        return {
            "actions": actions,
            "primary": primary,
            "confidence": round(confidence, 2),
            "market_regime": regime,
        }

    def _reason_with_llm(
        self, sentiment: Dict, technicals: Dict, risk: Dict, active: Dict, ltp: Dict, vix: float
    ) -> Dict:
        """Use Llama3.1 for multi-factor reasoning."""
        # Prepare concise summary for prompt
        tech_summary = {}
        for idx, data in technicals.get("indices", {}).items():
            if isinstance(data, dict) and "trend" in data:
                tech_summary[idx] = {
                    "trend": data.get("trend"),
                    "rsi": data.get("rsi"),
                    "support": data.get("support"),
                    "resistance": data.get("resistance"),
                }

        prompt = self.ollama.build_agent_prompt(
            agent_name="Decision Maker",
            steps=[
                f"Sentiment: score={sentiment.get('sentiment_score', 0)}, label={sentiment.get('label', 'neutral')}",
                f"Technicals: {tech_summary}",
                f"Risk: score={risk.get('risk_score', 0)}/100, label={risk.get('risk_label', 'medium')}, beta={risk.get('beta', 1)}",
                f"Active trades: {len(active.get('top_active', []))} high-activity options, PCR={active.get('pcr', {})}",
                f"VIX: {vix}, LTP: {ltp}",
                "Check if signals align (e.g., positive sentiment + upward trend + low risk + high call OI)",
                "Recommend specific actions with strike prices and reasons",
                "Include position sizing suggestion (% of capital)",
            ],
            data={
                "sentiment_score": sentiment.get("sentiment_score", 0),
                "trend_nifty": tech_summary.get("nifty50", {}).get("trend", "unknown"),
                "risk_score": risk.get("risk_score", 0),
                "risk_label": risk.get("risk_label", "medium"),
                "vix": vix,
                "top_active": [
                    {"strike": o.get("strike"), "type": o.get("type"), "score": o.get("activity_score")}
                    for o in active.get("top_active", [])[:3]
                ],
            },
            output_fields=["recommendation", "confidence", "reasoning", "position_size", "stop_loss", "target"],
        )
        return self.ollama.chat_json(prompt)
