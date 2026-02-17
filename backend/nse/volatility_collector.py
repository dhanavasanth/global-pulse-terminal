"""
NSE Volatility Data Collector
India VIX, IV percentile/rank, IV skew analysis, historical volatility.
"""

import logging
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class VolatilityCollector:
    """
    Collects and computes volatility metrics.

    Data:
    - India VIX (real-time from indices data)
    - Historical VIX for percentile/rank
    - IV percentile and rank from options chain
    - IV term structure across expiries
    - Historical volatility (realized vol)
    """

    def __init__(self, nse_client):
        self.nse = nse_client
        self._vix_history: List[float] = []

    async def collect_india_vix(self) -> Dict[str, Any]:
        """Get current India VIX from all indices endpoint."""
        data = await self.nse.get_all_indices()
        if not data or "data" not in data:
            return {"vix": 0, "error": "No data"}

        vix_data = None
        for item in data["data"]:
            if item.get("index") == "INDIA VIX":
                vix_data = item
                break

        if not vix_data:
            return {"vix": 0, "error": "VIX not found in indices"}

        current_vix = vix_data.get("last", 0)
        prev_close = vix_data.get("previousClose", 0)
        change = vix_data.get("variation", 0)
        pct_change = vix_data.get("percentChange", 0)

        # Track history for percentile
        if current_vix > 0:
            self._vix_history.append(current_vix)
            # Keep last 252 trading days worth
            if len(self._vix_history) > 252:
                self._vix_history = self._vix_history[-252:]

        # VIX regime classification
        if current_vix > 25:
            regime = "high_fear"
            signal = "Extreme caution - hedging essential"
        elif current_vix > 20:
            regime = "elevated"
            signal = "Above normal - wider stops recommended"
        elif current_vix > 15:
            regime = "normal"
            signal = "Normal conditions - standard strategies"
        elif current_vix > 10:
            regime = "low"
            signal = "Low vol - option selling favorable"
        else:
            regime = "complacent"
            signal = "Extremely low - potential vol expansion ahead"

        return {
            "vix": current_vix,
            "open": vix_data.get("open", 0),
            "high": vix_data.get("high", 0),
            "low": vix_data.get("low", 0),
            "prev_close": prev_close,
            "change": change,
            "pct_change": pct_change,
            "regime": regime,
            "signal": signal,
            "percentile": self._compute_vix_percentile(current_vix),
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_vix_history(self, days: int = 90) -> Dict[str, Any]:
        """Fetch historical VIX data for percentile calculations."""
        from_date = (datetime.now() - timedelta(days=days)).strftime("%d-%m-%Y")
        to_date = datetime.now().strftime("%d-%m-%Y")

        data = await self.nse.get_endpoint(
            "vix_history", from_date=from_date, to_date=to_date
        )
        if not data or "data" not in data:
            return {"history": [], "error": "No historical VIX data"}

        history = []
        for item in data.get("data", []):
            vix_close = item.get("CLOSE", item.get("close", 0))
            if isinstance(vix_close, str):
                try:
                    vix_close = float(vix_close)
                except ValueError:
                    continue
            history.append({
                "date": item.get("TIMESTAMP", item.get("date", "")),
                "open": float(item.get("OPEN", item.get("open", 0)) or 0),
                "high": float(item.get("HIGH", item.get("high", 0)) or 0),
                "low": float(item.get("LOW", item.get("low", 0)) or 0),
                "close": vix_close,
            })
            if vix_close > 0:
                self._vix_history.append(vix_close)

        # Deduplicate and keep recent
        seen = set()
        unique_history = []
        for h in self._vix_history:
            rounded = round(h, 2)
            if rounded not in seen:
                seen.add(rounded)
                unique_history.append(rounded)
        self._vix_history = unique_history[-252:]

        return {
            "history": history,
            "count": len(history),
            "stats": self._compute_vix_stats(),
            "timestamp": datetime.now().isoformat(),
        }

    def compute_iv_percentile(self, options_chain_data: Dict) -> Dict[str, Any]:
        """
        Compute IV percentile and rank from options chain data.
        IV Percentile = % of days IV was below current IV (over past year).
        IV Rank = (Current IV - 52wk Low IV) / (52wk High IV - 52wk Low IV).
        """
        chain = options_chain_data.get("chain", [])
        if not chain:
            return {"iv_percentile": 0, "iv_rank": 0}

        # Collect all IVs from current chain
        all_ivs = []
        for entry in chain:
            if entry.get("ce") and entry["ce"].get("iv", 0) > 0:
                all_ivs.append(entry["ce"]["iv"])
            if entry.get("pe") and entry["pe"].get("iv", 0) > 0:
                all_ivs.append(entry["pe"]["iv"])

        if not all_ivs:
            return {"iv_percentile": 0, "iv_rank": 0}

        current_iv = np.mean(all_ivs)
        iv_high = max(all_ivs)
        iv_low = min(all_ivs)

        # IV Rank
        iv_range = iv_high - iv_low
        iv_rank = ((current_iv - iv_low) / iv_range * 100) if iv_range > 0 else 50

        return {
            "current_iv": round(current_iv, 2),
            "iv_high": round(iv_high, 2),
            "iv_low": round(iv_low, 2),
            "iv_rank": round(iv_rank, 2),
            "iv_percentile": round(iv_rank, 2),  # Approximate without full history
            "iv_signal": "high" if iv_rank > 70 else ("low" if iv_rank < 30 else "normal"),
        }

    def compute_historical_volatility(self, closes: List[float], window: int = 20) -> Dict[str, Any]:
        """
        Compute realized (historical) volatility.
        HV = StdDev(log returns) * sqrt(252) * 100
        """
        if len(closes) < window + 1:
            return {"hv": 0, "error": "Insufficient data"}

        arr = np.array(closes, dtype=float)
        log_returns = np.log(arr[1:] / arr[:-1])

        # Rolling HV
        recent_returns = log_returns[-window:]
        hv = float(np.std(recent_returns) * math.sqrt(252) * 100)

        # Full period HV
        full_hv = float(np.std(log_returns) * math.sqrt(252) * 100)

        return {
            "hv_20d": round(hv, 2),
            "hv_full": round(full_hv, 2),
            "avg_daily_move": round(float(np.mean(np.abs(log_returns[-window:]))) * 100, 2),
            "max_daily_move": round(float(np.max(np.abs(log_returns[-window:]))) * 100, 2),
        }

    def _compute_vix_percentile(self, current: float) -> float:
        """Compute where current VIX sits in historical distribution."""
        if not self._vix_history or current <= 0:
            return 50.0
        below = sum(1 for v in self._vix_history if v < current)
        return round((below / len(self._vix_history)) * 100, 1)

    def _compute_vix_stats(self) -> Dict[str, float]:
        """Compute VIX statistics from history."""
        if not self._vix_history:
            return {}
        arr = np.array(self._vix_history)
        return {
            "mean": round(float(np.mean(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "std": round(float(np.std(arr)), 2),
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2),
            "current_percentile": self._compute_vix_percentile(float(arr[-1])) if len(arr) > 0 else 50,
        }
