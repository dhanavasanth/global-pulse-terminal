"""
Data Fetcher Agent
Fetches live intraday data for Nifty50, Sensex, BankNifty options.
Sources: Angel One SmartAPI (LTP, options chain), yfinance (VIX, historical), RSS (news).
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .angelone_client import AngelOneClient

logger = logging.getLogger(__name__)

# Optional imports with graceful fallback
try:
    import yfinance as yf
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False
    logger.warning("⚠️ yfinance not installed. Index/VIX data unavailable.")

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False
    logger.warning("⚠️ feedparser not installed. News feed unavailable.")


# NSE Index ticker mapping for yfinance
INDEX_TICKERS = {
    "nifty50": "^NSEI",
    "sensex": "^BSESN",
    "banknifty": "^NSEBANK",
}

VIX_TICKER = "^INDIAVIX"

# News RSS feeds for Indian markets
NEWS_FEEDS = [
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "https://www.moneycontrol.com/rss/marketreports.xml",
    "https://www.livemint.com/rss/markets",
]

# Sample options chain data for when SmartAPI is not connected
SAMPLE_STRIKES = {
    "nifty50": [24500, 24600, 24700, 24800, 24900, 25000, 25100, 25200, 25300, 25400, 25500],
    "banknifty": [51000, 51500, 52000, 52500, 53000, 53500, 54000, 54500, 55000],
}


class DataFetcherAgent:
    """
    Fetches and validates intraday market data.
    Outputs structured data to shared state for other agents.
    Uses Angel One SmartAPI for live data, yfinance as secondary source.
    """

    def __init__(self, ollama_client=None, angelone_client: Optional[AngelOneClient] = None):
        self.ollama = ollama_client
        self.angelone = angelone_client or AngelOneClient()
        self._cache: Dict[str, Any] = {}
        self._cache_ttl = 30  # seconds
        self._last_fetch: Dict[str, float] = {}

    async def run(self, shared_state) -> Dict[str, Any]:
        """Main execution: fetch all data sources and populate shared state."""
        start = time.time()
        result = {
            "ltp": {},
            "vix": None,
            "options_chain": [],
            "news": [],
            "historical": {},
            "timestamp": datetime.now().isoformat(),
        }

        # 1. Fetch Index LTPs
        try:
            result["ltp"] = self._fetch_index_ltp()
            logger.info(f"📊 LTP fetched: {result['ltp']}")
        except Exception as e:
            logger.error(f"LTP fetch failed: {e}")
            result["ltp"] = self._get_cached("ltp", {})

        # 2. Fetch VIX
        try:
            result["vix"] = self._fetch_vix()
            logger.info(f"📈 VIX: {result['vix']}")
        except Exception as e:
            logger.error(f"VIX fetch failed: {e}")
            result["vix"] = self._get_cached("vix", 15.0)

        # 3. Fetch Options Chain
        try:
            result["options_chain"] = self._fetch_options_chain()
            logger.info(f"🔗 Options chain: {len(result['options_chain'])} contracts")
        except Exception as e:
            logger.error(f"Options chain fetch failed: {e}")
            result["options_chain"] = self._get_cached("options_chain", [])

        # 4. Fetch News
        try:
            result["news"] = self._fetch_news()
            logger.info(f"📰 News: {len(result['news'])} headlines")
        except Exception as e:
            logger.error(f"News fetch failed: {e}")
            result["news"] = []

        # 5. Fetch Historical Data (for technicals)
        try:
            result["historical"] = self._fetch_historical()
        except Exception as e:
            logger.error(f"Historical data fetch failed: {e}")

        # Cache results
        for key in ["ltp", "vix", "options_chain"]:
            self._set_cache(key, result[key])

        # Update shared state
        shared_state.set("market_data", result)
        shared_state.set("ltp", result["ltp"])
        shared_state.set("vix", result["vix"])
        shared_state.set("options_chain", result["options_chain"])
        shared_state.set("news", result["news"])
        shared_state.set("historical", result["historical"])

        # Validate with Llama if available
        if self.ollama and self.ollama.is_available:
            validation = self._validate_data(result)
            result["validation"] = validation

        result["fetch_duration_ms"] = (time.time() - start) * 1000
        return result

    def _fetch_index_ltp(self) -> Dict[str, float]:
        """Fetch latest traded prices for all indices.
        Priority: Angel One SmartAPI → yfinance → simulated data.
        """
        # Try Angel One first
        try:
            angel_ltp = self.angelone.get_index_ltp()
            if angel_ltp and len(angel_ltp) >= 2:  # At least 2 indices
                logger.info(f"📊 Using Angel One live LTP: {angel_ltp}")
                return angel_ltp
        except Exception as e:
            logger.warning(f"Angel One LTP failed, falling back to yfinance: {e}")

        # Fallback to yfinance
        ltp = {}
        if not YF_AVAILABLE:
            return {"nifty50": 25000.0, "sensex": 82000.0, "banknifty": 53000.0}

        for name, ticker in INDEX_TICKERS.items():
            try:
                data = yf.Ticker(ticker)
                hist = data.history(period="1d", interval="1m")
                if not hist.empty:
                    ltp[name] = round(float(hist["Close"].iloc[-1]), 2)
                else:
                    info = data.info
                    ltp[name] = info.get("regularMarketPrice", 0)
            except Exception as e:
                logger.warning(f"Failed to fetch {name}: {e}")
                ltp[name] = self._get_cached("ltp", {}).get(name, 0)

        return ltp

    def _fetch_vix(self) -> float:
        """Fetch India VIX."""
        if not YF_AVAILABLE:
            return 15.0

        try:
            vix = yf.Ticker(VIX_TICKER)
            hist = vix.history(period="1d", interval="1m")
            if not hist.empty:
                return round(float(hist["Close"].iloc[-1]), 2)
            return round(float(vix.info.get("regularMarketPrice", 15.0)), 2)
        except Exception:
            return 15.0

    def _fetch_options_chain(self) -> List[Dict]:
        """
        Fetch options chain data.
        Priority: Angel One SmartAPI → sample data fallback.
        """
        all_options = []

        # Try Angel One SmartAPI
        for underlying in ["NIFTY", "BANKNIFTY"]:
            try:
                live_chain = self.angelone.get_option_chain(
                    underlying=underlying,
                    num_strikes=11,
                )
                if live_chain:
                    all_options.extend(live_chain)
                    logger.info(f"[AngelOne] ✅ {underlying}: {len(live_chain)} live contracts")
            except Exception as e:
                logger.warning(f"[AngelOne] {underlying} chain failed: {e}")

        if all_options:
            logger.info(f"🔗 Live options chain: {len(all_options)} total contracts")
            return all_options

        # Fallback to sample data
        logger.info("📋 Using sample options chain (Angel One unavailable)")
        return self._generate_sample_options_chain()

    def _generate_sample_options_chain(self) -> List[Dict]:
        """Generate realistic sample options chain data as fallback."""
        import random

        options = []
        base_prices = {"nifty50": 25000, "banknifty": 53000}

        for index, base in base_prices.items():
            strikes = SAMPLE_STRIKES.get(index, [])
            for strike in strikes:
                for opt_type in ["CE", "PE"]:
                    distance = abs(strike - base)
                    itm = (opt_type == "CE" and strike < base) or (opt_type == "PE" and strike > base)

                    if itm:
                        ltp = distance + random.uniform(50, 200)
                    else:
                        ltp = max(5, 300 - distance * 0.5 + random.uniform(-30, 30))

                    oi = random.randint(10000, 200000)
                    volume = random.randint(5000, 100000)

                    if distance <= 200:
                        oi = int(oi * 2.5)
                        volume = int(volume * 3)

                    options.append({
                        "index": index,
                        "strike": strike,
                        "type": opt_type,
                        "ltp": round(ltp, 2),
                        "oi": oi,
                        "volume": volume,
                        "change_oi": random.randint(-5000, 15000),
                        "iv": round(random.uniform(10, 35), 2),
                        "expiry": self._get_next_expiry(),
                        "bid": round(ltp - random.uniform(0.5, 2), 2),
                        "ask": round(ltp + random.uniform(0.5, 2), 2),
                        "source": "sample",
                    })

        return options

    def _fetch_news(self, max_headlines: int = 15) -> List[Dict]:
        """Fetch market news from RSS feeds."""
        if not FEEDPARSER_AVAILABLE:
            return self._sample_news()

        headlines = []
        for feed_url in NEWS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:5]:
                    headlines.append({
                        "title": entry.get("title", ""),
                        "summary": entry.get("summary", "")[:200],
                        "link": entry.get("link", ""),
                        "published": entry.get("published", ""),
                        "source": feed_url.split("/")[2],
                    })
            except Exception as e:
                logger.warning(f"RSS feed error ({feed_url}): {e}")

        return headlines[:max_headlines] if headlines else self._sample_news()

    def _fetch_historical(self) -> Dict[str, Any]:
        """Fetch intraday historical data for technical analysis."""
        if not YF_AVAILABLE:
            return {}

        historical = {}
        for name, ticker in INDEX_TICKERS.items():
            try:
                data = yf.Ticker(ticker)
                hist = data.history(period="5d", interval="5m")
                if not hist.empty:
                    historical[name] = {
                        "open": hist["Open"].tolist(),
                        "high": hist["High"].tolist(),
                        "close": hist["Close"].tolist(),
                        "low": hist["Low"].tolist(),
                        "volume": hist["Volume"].tolist(),
                        "timestamps": [str(t) for t in hist.index.tolist()],
                    }
            except Exception as e:
                logger.warning(f"Historical data for {name} failed: {e}")

        return historical

    def _validate_data(self, data: Dict) -> Dict:
        """Use Llama3.1 to validate fetched data for anomalies."""
        prompt = self.ollama.build_agent_prompt(
            agent_name="Data Validator",
            steps=[
                "Check if LTP values are within reasonable ranges for Indian indices",
                "Check if VIX is within normal range (8-40)",
                "Flag any stale data (unchanged values)",
                "Report data quality score (0-100)",
            ],
            data={
                "ltp": data.get("ltp", {}),
                "vix": data.get("vix"),
                "options_count": len(data.get("options_chain", [])),
                "news_count": len(data.get("news", [])),
            },
            output_fields=["quality_score", "issues", "suggestions"],
        )
        return self.ollama.chat_json(prompt)

    def _get_next_expiry(self) -> str:
        """Get the next Thursday (NSE weekly expiry)."""
        today = datetime.now()
        days_until_thursday = (3 - today.weekday()) % 7
        if days_until_thursday == 0 and today.hour >= 15:
            days_until_thursday = 7
        next_thursday = today + timedelta(days=days_until_thursday)
        return next_thursday.strftime("%Y-%m-%d")

    def _set_cache(self, key: str, value: Any):
        self._cache[key] = value
        self._last_fetch[key] = time.time()

    def _get_cached(self, key: str, default: Any = None) -> Any:
        if key in self._cache:
            age = time.time() - self._last_fetch.get(key, 0)
            if age < self._cache_ttl * 10:  # Extended TTL for fallback
                return self._cache[key]
        return default

    @staticmethod
    def _sample_news() -> List[Dict]:
        """Fallback sample news for testing."""
        return [
            {"title": "Nifty50 opens flat amid global cues", "source": "ET", "summary": "Markets opened unchanged..."},
            {"title": "BankNifty crosses 53000 on strong earnings", "source": "MC", "summary": "Banking index rallied..."},
            {"title": "FIIs turn net buyers after 3 weeks", "source": "Mint", "summary": "Foreign institutional..."},
            {"title": "RBI holds rates steady, outlook positive", "source": "ET", "summary": "Reserve Bank of India..."},
            {"title": "IT stocks under pressure on global slowdown fears", "source": "MC", "summary": "Technology sector..."},
        ]
