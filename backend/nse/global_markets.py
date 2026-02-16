"""
Global Markets Collector
Fetches US, Asian, European markets, currencies, commodities.
Used for correlation analysis with NSE/Indian markets.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

try:
    import yfinance as yf
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False
    logger.warning("yfinance not installed - global markets unavailable")


# Thread pool for yfinance (it's synchronous)
_executor = ThreadPoolExecutor(max_workers=4)


class GlobalMarketsCollector:
    """
    Collects global market data for correlation with Indian markets.

    Data:
    - US Markets (S&P 500, Nasdaq, Dow Jones, VIX)
    - Asian Markets (Nikkei, Hang Seng, Shanghai, KOSPI)
    - European Markets (FTSE, DAX, CAC)
    - Currencies (USD/INR, EUR/INR, GBP/INR)
    - Commodities (Gold, Silver, Crude Oil, Natural Gas)
    - US Treasury Yields
    - Crypto (BTC, ETH)
    """

    TICKERS = {
        "us_markets": {
            "S&P 500": "^GSPC",
            "Nasdaq": "^IXIC",
            "Dow Jones": "^DJI",
            "Russell 2000": "^RUT",
            "US VIX": "^VIX",
        },
        "asian_markets": {
            "Nikkei 225": "^N225",
            "Hang Seng": "^HSI",
            "Shanghai": "000001.SS",
            "KOSPI": "^KS11",
            "Straits Times": "^STI",
            "Taiwan": "^TWII",
            "ASX 200": "^AXJO",
        },
        "european_markets": {
            "FTSE 100": "^FTSE",
            "DAX": "^GDAXI",
            "CAC 40": "^FCHI",
            "Euro Stoxx 50": "^STOXX50E",
        },
        "currencies": {
            "USD/INR": "USDINR=X",
            "EUR/INR": "EURINR=X",
            "GBP/INR": "GBPINR=X",
            "JPY/INR": "JPYINR=X",
            "DXY": "DX-Y.NYB",
        },
        "commodities": {
            "Gold": "GC=F",
            "Silver": "SI=F",
            "Crude Oil": "CL=F",
            "Natural Gas": "NG=F",
            "Copper": "HG=F",
        },
        "crypto": {
            "Bitcoin": "BTC-USD",
            "Ethereum": "ETH-USD",
        },
        "bonds": {
            "US 10Y": "^TNX",
            "US 2Y": "^IRX",
        },
    }

    def __init__(self):
        pass

    async def collect_all(self) -> Dict[str, Any]:
        """Collect all global market data."""
        if not YF_AVAILABLE:
            return {"error": "yfinance not installed", "timestamp": datetime.now().isoformat()}

        loop = asyncio.get_event_loop()
        results = {}

        # Collect all categories in parallel using thread pool
        tasks = []
        for category, tickers in self.TICKERS.items():
            task = loop.run_in_executor(_executor, self._fetch_category, category, tickers)
            tasks.append((category, task))

        for category, task in tasks:
            try:
                result = await task
                results[category] = result
            except Exception as e:
                logger.error(f"Global markets error for {category}: {e}")
                results[category] = {"error": str(e)}

        # Add correlation signals
        results["signals"] = self._compute_signals(results)
        results["timestamp"] = datetime.now().isoformat()

        return results

    async def collect_category(self, category: str) -> Dict[str, Any]:
        """Collect a specific category of global data."""
        if not YF_AVAILABLE:
            return {"error": "yfinance not installed"}

        tickers = self.TICKERS.get(category, {})
        if not tickers:
            return {"error": f"Unknown category: {category}"}

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(_executor, self._fetch_category, category, tickers)
        return result

    async def collect_us_futures(self) -> Dict[str, Any]:
        """
        Collect US futures data - critical for pre-market Indian market prediction.
        US futures movement overnight strongly correlates with Indian market open.
        """
        if not YF_AVAILABLE:
            return {"error": "yfinance not installed"}

        futures = {
            "ES=F": "S&P 500 Futures",
            "NQ=F": "Nasdaq Futures",
            "YM=F": "Dow Futures",
        }

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(_executor, self._fetch_category, "us_futures", futures)
        return result

    def _fetch_category(self, category: str, tickers: Dict[str, str]) -> Dict[str, Any]:
        """Fetch data for a category of tickers (runs in thread pool)."""
        results = {}
        for name, ticker in tickers.items():
            try:
                data = yf.Ticker(ticker)
                info = data.fast_info

                # Get recent history for change calculation
                hist = data.history(period="2d")

                last_price = 0
                prev_close = 0
                change = 0
                pct_change = 0

                if not hist.empty:
                    last_price = float(hist["Close"].iloc[-1])
                    if len(hist) > 1:
                        prev_close = float(hist["Close"].iloc[-2])
                    else:
                        prev_close = last_price
                    change = round(last_price - prev_close, 2)
                    pct_change = round((change / prev_close) * 100, 2) if prev_close else 0

                results[name] = {
                    "ticker": ticker,
                    "last": round(last_price, 2),
                    "prev_close": round(prev_close, 2),
                    "change": change,
                    "pct_change": pct_change,
                    "direction": "up" if change > 0 else ("down" if change < 0 else "flat"),
                }

            except Exception as e:
                logger.warning(f"Failed to fetch {name} ({ticker}): {e}")
                results[name] = {"ticker": ticker, "error": str(e)}

        return results

    def _compute_signals(self, data: Dict) -> Dict[str, Any]:
        """Compute correlation signals for Indian market prediction."""
        signals = {}

        # US market signal (strongest correlation with Indian markets)
        us = data.get("us_markets", {})
        sp500 = us.get("S&P 500", {})
        nasdaq = us.get("Nasdaq", {})
        us_vix = us.get("US VIX", {})

        sp500_change = sp500.get("pct_change", 0)
        nasdaq_change = nasdaq.get("pct_change", 0)

        if sp500_change > 0.5 and nasdaq_change > 0.5:
            signals["us_signal"] = "bullish"
        elif sp500_change < -0.5 and nasdaq_change < -0.5:
            signals["us_signal"] = "bearish"
        else:
            signals["us_signal"] = "neutral"

        # Asian market signal
        asian = data.get("asian_markets", {})
        asian_changes = [
            v.get("pct_change", 0) for v in asian.values()
            if isinstance(v, dict) and "pct_change" in v
        ]
        avg_asian = sum(asian_changes) / len(asian_changes) if asian_changes else 0
        signals["asian_signal"] = "bullish" if avg_asian > 0.3 else ("bearish" if avg_asian < -0.3 else "neutral")

        # Currency signal (strong INR = negative for exporters like IT)
        currencies = data.get("currencies", {})
        usd_inr = currencies.get("USD/INR", {})
        usd_change = usd_inr.get("pct_change", 0)
        signals["currency_signal"] = "inr_strong" if usd_change < -0.2 else ("inr_weak" if usd_change > 0.2 else "stable")

        # Commodity signal (high crude = negative for India)
        commodities = data.get("commodities", {})
        crude = commodities.get("Crude Oil", {})
        gold = commodities.get("Gold", {})
        signals["crude_signal"] = "negative" if crude.get("pct_change", 0) > 1 else "neutral"
        signals["gold_signal"] = "risk_off" if gold.get("pct_change", 0) > 0.5 else "neutral"

        # Overall signal
        bullish_count = sum(1 for v in signals.values() if v in ["bullish", "neutral", "stable", "inr_strong"])
        bearish_count = sum(1 for v in signals.values() if v in ["bearish", "inr_weak", "negative", "risk_off"])
        signals["overall"] = "bullish" if bullish_count > bearish_count else ("bearish" if bearish_count > bullish_count else "neutral")

        return signals
