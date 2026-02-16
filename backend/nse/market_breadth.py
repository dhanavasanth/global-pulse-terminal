"""
NSE Market Breadth Collector
Advance/Decline data, market pulse, top movers, 52-week highs/lows.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MarketBreadthCollector:
    """
    Collects market breadth and sentiment indicators.

    Data:
    - Advance/Decline ratio
    - New 52-week highs/lows
    - Top gainers/losers (value, volume)
    - Most active stocks
    - Sector rotation analysis
    """

    def __init__(self, nse_client):
        self.nse = nse_client

    async def collect_market_breadth(self) -> Dict[str, Any]:
        """
        Comprehensive market breadth from all indices.
        AD ratio > 2 = strong bull, < 0.5 = strong bear.
        """
        data = await self.nse.get_all_indices()
        if not data or "data" not in data:
            return {"error": "No data"}

        # Find Nifty 50 and broader indices
        nifty_data = None
        nifty500_data = None
        for item in data["data"]:
            if item.get("index") == "NIFTY 50":
                nifty_data = item
            elif item.get("index") == "NIFTY 500":
                nifty500_data = item

        # Use broadest available index
        ref = nifty500_data or nifty_data or {}
        advances = ref.get("advances", 0)
        declines = ref.get("declines", 0)
        unchanged = ref.get("unchanged", 0)
        total = advances + declines + unchanged

        ad_ratio = round(advances / declines, 2) if declines > 0 else 0
        ad_line = advances - declines

        # Breadth classification
        if ad_ratio > 2.0:
            breadth_signal = "strong_bullish"
        elif ad_ratio > 1.2:
            breadth_signal = "bullish"
        elif ad_ratio > 0.8:
            breadth_signal = "neutral"
        elif ad_ratio > 0.5:
            breadth_signal = "bearish"
        else:
            breadth_signal = "strong_bearish"

        # Breadth percentage
        advance_pct = round((advances / total) * 100, 1) if total > 0 else 0
        decline_pct = round((declines / total) * 100, 1) if total > 0 else 0

        return {
            "advances": advances,
            "declines": declines,
            "unchanged": unchanged,
            "total": total,
            "ad_ratio": ad_ratio,
            "ad_line": ad_line,
            "advance_pct": advance_pct,
            "decline_pct": decline_pct,
            "breadth_signal": breadth_signal,
            "index_used": ref.get("index", "NIFTY 500"),
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_top_gainers(self, index: str = "gainers") -> Dict[str, Any]:
        """Top gaining stocks by percentage change."""
        data = await self.nse.get_endpoint("advances_declines", index="gainers")
        if not data:
            return {"gainers": []}

        raw = data.get("NIFTY", data.get("allSec", data.get("data", [])))
        if isinstance(raw, dict):
            raw = raw.get("data", [])

        gainers = []
        for item in raw[:20] if isinstance(raw, list) else []:
            gainers.append({
                "symbol": item.get("symbol", ""),
                "last_price": item.get("ltp", item.get("lastPrice", 0)),
                "change": item.get("netPrice", item.get("change", 0)),
                "pct_change": item.get("perChange", item.get("pChange", 0)),
                "volume": item.get("trdQnty", item.get("totalTradedVolume", 0)),
            })

        return {
            "gainers": gainers,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_top_losers(self) -> Dict[str, Any]:
        """Top losing stocks by percentage change."""
        data = await self.nse.get_endpoint("advances_declines", index="losers")
        if not data:
            return {"losers": []}

        raw = data.get("NIFTY", data.get("allSec", data.get("data", [])))
        if isinstance(raw, dict):
            raw = raw.get("data", [])

        losers = []
        for item in raw[:20] if isinstance(raw, list) else []:
            losers.append({
                "symbol": item.get("symbol", ""),
                "last_price": item.get("ltp", item.get("lastPrice", 0)),
                "change": item.get("netPrice", item.get("change", 0)),
                "pct_change": item.get("perChange", item.get("pChange", 0)),
                "volume": item.get("trdQnty", item.get("totalTradedVolume", 0)),
            })

        return {
            "losers": losers,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_most_active(self) -> Dict[str, Any]:
        """Most active stocks by volume and value."""
        data = await self.nse.get_endpoint("most_active")
        if not data:
            return {"most_active": []}

        raw = data.get("NIFTY", data.get("allSec", data.get("data", [])))
        if isinstance(raw, dict):
            raw = raw.get("data", [])

        active = []
        for item in raw[:20] if isinstance(raw, list) else []:
            active.append({
                "symbol": item.get("symbol", ""),
                "last_price": item.get("ltp", item.get("lastPrice", 0)),
                "pct_change": item.get("perChange", item.get("pChange", 0)),
                "volume": item.get("trdQnty", item.get("totalTradedVolume", 0)),
                "value": item.get("turnover", item.get("totalTradedValue", 0)),
            })

        return {
            "most_active": active,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_full_pulse(self) -> Dict[str, Any]:
        """
        Complete market pulse combining breadth, movers, and activity.
        Single call for Bloomberg-style overview.
        """
        import asyncio
        breadth, gainers, losers, active = await asyncio.gather(
            self.collect_market_breadth(),
            self.collect_top_gainers(),
            self.collect_top_losers(),
            self.collect_most_active(),
            return_exceptions=True,
        )

        return {
            "breadth": breadth if not isinstance(breadth, Exception) else {"error": str(breadth)},
            "top_gainers": (gainers if not isinstance(gainers, Exception) else {}).get("gainers", [])[:10],
            "top_losers": (losers if not isinstance(losers, Exception) else {}).get("losers", [])[:10],
            "most_active": (active if not isinstance(active, Exception) else {}).get("most_active", [])[:10],
            "timestamp": datetime.now().isoformat(),
        }
