"""
Technical Analyzer Agent
Computes support/resistance, RSI, EMA, trend detection from intraday OHLC data.
"""

import logging
import time
import math
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class TechnicalAgent:
    """
    Performs technical analysis on intraday data.
    Computes pivots, RSI, EMAs, and trend classification.
    """

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client

    async def run(self, shared_state) -> Dict[str, Any]:
        """Run technical analysis on historical data from shared state."""
        start = time.time()
        historical = shared_state.get("historical", {})
        ltp = shared_state.get("ltp", {})

        results = {}
        for index_name in ["nifty50", "banknifty", "sensex"]:
            data = historical.get(index_name, {})
            current_ltp = ltp.get(index_name, 0)

            if data and data.get("close"):
                analysis = self._analyze_index(index_name, data, current_ltp)
            else:
                analysis = self._default_analysis(index_name, current_ltp)

            results[index_name] = analysis

        # AI interpretation
        if self.ollama and self.ollama.is_available:
            interpretation = self._interpret_with_llm(results, ltp)
            results["ai_interpretation"] = interpretation

        result = {
            "indices": results,
            "timestamp": datetime.now().isoformat(),
            "duration_ms": (time.time() - start) * 1000,
        }

        shared_state.set("technicals", result)
        return result

    def _analyze_index(self, name: str, data: Dict, ltp: float) -> Dict[str, Any]:
        """Full technical analysis for a single index."""
        closes = np.array(data["close"], dtype=float)
        highs = np.array(data["high"], dtype=float)
        lows = np.array(data["low"], dtype=float)

        # Pivot Points (Classic)
        pivot = self._compute_pivots(highs, lows, closes)

        # RSI (14-period)
        rsi = self._compute_rsi(closes, period=14)

        # EMAs
        ema_9 = self._compute_ema(closes, period=9)
        ema_21 = self._compute_ema(closes, period=21)

        # Trend Detection
        trend = self._detect_trend(closes, ema_9, ema_21)

        # Volume analysis (if available)
        volumes = data.get("volume", [])
        vol_analysis = self._analyze_volume(volumes) if volumes else {}

        # Determine support/resistance levels
        support = pivot.get("s1", ltp * 0.99)
        resistance = pivot.get("r1", ltp * 1.01)

        return {
            "ltp": ltp,
            "support": round(support, 2),
            "resistance": round(resistance, 2),
            "pivot": pivot,
            "rsi": round(rsi, 2),
            "rsi_signal": self._rsi_signal(rsi),
            "ema_9": round(ema_9, 2),
            "ema_21": round(ema_21, 2),
            "trend": trend,
            "volume": vol_analysis,
            "ltp_vs_support": round(((ltp - support) / support) * 100, 2) if support else 0,
            "ltp_vs_resistance": round(((resistance - ltp) / ltp) * 100, 2) if ltp else 0,
        }

    def _default_analysis(self, name: str, ltp: float) -> Dict[str, Any]:
        """Default analysis when no historical data available."""
        return {
            "ltp": ltp,
            "support": round(ltp * 0.99, 2),
            "resistance": round(ltp * 1.01, 2),
            "pivot": {"pp": ltp, "r1": ltp * 1.01, "s1": ltp * 0.99},
            "rsi": 50.0,
            "rsi_signal": "neutral",
            "ema_9": ltp,
            "ema_21": ltp,
            "trend": "sideways",
            "volume": {},
            "note": "Using defaults — no historical data available",
        }

    @staticmethod
    def _compute_pivots(highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Dict[str, float]:
        """
        Classic Pivot Points calculation.
        PP = (High + Low + Close) / 3
        R1 = 2*PP - Low, S1 = 2*PP - High
        R2 = PP + (High - Low), S2 = PP - (High - Low)
        R3 = High + 2*(PP - Low), S3 = Low - 2*(High - PP)
        """
        # Use the last day's data
        h = float(np.max(highs[-78:]))   # ~78 5-min candles per day
        l = float(np.min(lows[-78:]))
        c = float(closes[-1])

        pp = (h + l + c) / 3
        r1 = 2 * pp - l
        s1 = 2 * pp - h
        r2 = pp + (h - l)
        s2 = pp - (h - l)
        r3 = h + 2 * (pp - l)
        s3 = l - 2 * (h - pp)

        return {
            "pp": round(pp, 2),
            "r1": round(r1, 2),
            "r2": round(r2, 2),
            "r3": round(r3, 2),
            "s1": round(s1, 2),
            "s2": round(s2, 2),
            "s3": round(s3, 2),
        }

    @staticmethod
    def _compute_rsi(closes: np.ndarray, period: int = 14) -> float:
        """
        Relative Strength Index (RSI).
        RSI = 100 - 100/(1 + RS), RS = avg_gain / avg_loss
        """
        if len(closes) < period + 1:
            return 50.0  # Default neutral

        deltas = np.diff(closes)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        # Wilder's smoothing
        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])

        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return float(rsi)

    @staticmethod
    def _compute_ema(data: np.ndarray, period: int) -> float:
        """Exponential Moving Average (latest value)."""
        if len(data) < period:
            return float(np.mean(data)) if len(data) > 0 else 0

        multiplier = 2.0 / (period + 1)
        ema = float(np.mean(data[:period]))

        for price in data[period:]:
            ema = (float(price) - ema) * multiplier + ema

        return ema

    @staticmethod
    def _detect_trend(closes: np.ndarray, ema_9: float, ema_21: float) -> str:
        """
        Detect trend based on EMA crossover and price action.
        - Upward: EMA9 > EMA21 and price above EMA9
        - Downward: EMA9 < EMA21 and price below EMA9
        - Sideways: Mixed signals
        """
        if len(closes) < 2:
            return "sideways"

        current = float(closes[-1])

        if ema_9 > ema_21 and current > ema_9:
            return "upward"
        elif ema_9 < ema_21 and current < ema_9:
            return "downward"
        else:
            return "sideways"

    @staticmethod
    def _rsi_signal(rsi: float) -> str:
        """Convert RSI to a trading signal."""
        if rsi >= 70:
            return "overbought"
        elif rsi <= 30:
            return "oversold"
        elif rsi >= 60:
            return "bullish"
        elif rsi <= 40:
            return "bearish"
        return "neutral"

    @staticmethod
    def _analyze_volume(volumes: List) -> Dict[str, Any]:
        """Analyze volume patterns."""
        if not volumes:
            return {}
        vols = np.array(volumes, dtype=float)
        recent = vols[-20:] if len(vols) >= 20 else vols
        avg_vol = float(np.mean(vols))
        current_vol = float(vols[-1]) if len(vols) > 0 else 0

        return {
            "current": current_vol,
            "average": round(avg_vol, 0),
            "ratio": round(current_vol / avg_vol, 2) if avg_vol > 0 else 0,
            "trend": "increasing" if current_vol > avg_vol * 1.2 else (
                "decreasing" if current_vol < avg_vol * 0.8 else "normal"
            ),
        }

    def _interpret_with_llm(self, results: Dict, ltp: Dict) -> Dict:
        """Use Llama3.1 for qualitative interpretation of technicals."""
        prompt = self.ollama.build_agent_prompt(
            agent_name="Technical Analyst",
            steps=[
                "Review the technical indicators for each index",
                "Identify the strongest setup for intraday trading",
                "If RSI is near extremes, flag potential reversal",
                "If LTP is near support, suggest call buy; near resistance, suggest put buy",
                "Grade overall technical setup as A/B/C/D",
            ],
            data={
                idx: {
                    "support": r.get("support"),
                    "resistance": r.get("resistance"),
                    "rsi": r.get("rsi"),
                    "trend": r.get("trend"),
                    "ema_9": r.get("ema_9"),
                    "ema_21": r.get("ema_21"),
                }
                for idx, r in results.items()
                if isinstance(r, dict) and "support" in r
            },
            output_fields=["grade", "best_setup", "signals", "recommendation"],
        )
        return self.ollama.chat_json(prompt)
