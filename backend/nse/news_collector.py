"""
News & Sentiment Collector
Aggregates market news from multiple RSS feeds and analyzes sentiment.
Enhanced version of the existing sentiment agent with more sources.
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False

_executor = ThreadPoolExecutor(max_workers=3)


class NewsCollector:
    """
    Aggregates financial news from multiple sources.
    Provides sentiment scoring using keyword analysis and optional LLM.

    Sources:
    - Economic Times
    - Moneycontrol
    - LiveMint
    - Business Standard
    - CNBC TV18
    - Reuters India
    """

    RSS_FEEDS = {
        "economic_times": {
            "market_reports": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
            "stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
            "top_stories": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        },
        "moneycontrol": {
            "latest": "https://www.moneycontrol.com/rss/latestnews.xml",
            "market_reports": "https://www.moneycontrol.com/rss/marketreports.xml",
            "market_outlook": "https://www.moneycontrol.com/rss/marketoutlook.xml",
        },
        "livemint": {
            "markets": "https://www.livemint.com/rss/markets",
            "money": "https://www.livemint.com/rss/money",
        },
        "business_standard": {
            "markets": "https://www.business-standard.com/rss/markets-106.rss",
        },
    }

    # Sentiment keywords
    BULLISH_KEYWORDS = [
        "rally", "bullish", "surge", "gain", "positive", "rise", "growth",
        "profit", "record high", "breakout", "strong", "earnings beat",
        "upgrade", "optimistic", "recovery", "buy", "accumulate",
        "outperform", "target raised", "boom", "all-time high",
        "FII buying", "DII buying", "net buyer",
    ]

    BEARISH_KEYWORDS = [
        "crash", "bearish", "fall", "decline", "drop", "loss", "negative",
        "selloff", "sell-off", "panic", "fear", "correction", "weak",
        "downgrade", "recession", "slowdown", "miss", "pressure",
        "sellout", "underperform", "target cut", "slump",
        "FII selling", "DII selling", "net seller",
    ]

    VOLATILITY_KEYWORDS = [
        "volatile", "uncertainty", "RBI", "Fed", "interest rate",
        "inflation", "GDP", "election", "budget", "policy",
        "geopolitical", "war", "sanctions", "tariff",
    ]

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client

    async def collect_all_news(self, max_per_source: int = 5) -> Dict[str, Any]:
        """Fetch news from all RSS sources."""
        if not FEEDPARSER_AVAILABLE:
            return {"articles": [], "error": "feedparser not installed"}

        loop = asyncio.get_event_loop()
        all_articles = []

        # Fetch all feeds in parallel
        tasks = []
        for source, feeds in self.RSS_FEEDS.items():
            for feed_name, url in feeds.items():
                task = loop.run_in_executor(
                    _executor, self._fetch_feed, source, feed_name, url, max_per_source
                )
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            elif isinstance(result, Exception):
                logger.warning(f"Feed error: {result}")

        # Remove duplicates by title
        seen_titles = set()
        unique = []
        for article in all_articles:
            title = article.get("title", "").strip().lower()
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique.append(article)

        # Sort by published date (newest first)
        unique.sort(key=lambda x: x.get("published", ""), reverse=True)

        # Score sentiment for each article
        for article in unique:
            sentiment = self._score_article(article)
            article.update(sentiment)

        # Aggregate sentiment
        scores = [a.get("sentiment_score", 0) for a in unique if a.get("sentiment_score") is not None]
        avg_score = sum(scores) / len(scores) if scores else 0

        # Detect market-moving events
        catalysts = [a for a in unique if a.get("is_catalyst", False)]

        return {
            "articles": unique[:50],  # Cap at 50
            "total_count": len(unique),
            "aggregate_sentiment": {
                "score": round(avg_score, 3),
                "label": self._score_to_label(avg_score),
                "bullish_count": sum(1 for a in unique if a.get("sentiment_label") == "bullish"),
                "bearish_count": sum(1 for a in unique if a.get("sentiment_label") == "bearish"),
                "neutral_count": sum(1 for a in unique if a.get("sentiment_label") == "neutral"),
            },
            "catalysts": catalysts[:5],
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_source(self, source: str) -> Dict[str, Any]:
        """Fetch news from a specific source."""
        if not FEEDPARSER_AVAILABLE:
            return {"articles": [], "error": "feedparser not installed"}

        feeds = self.RSS_FEEDS.get(source, {})
        if not feeds:
            return {"articles": [], "error": f"Unknown source: {source}"}

        loop = asyncio.get_event_loop()
        articles = []

        for feed_name, url in feeds.items():
            try:
                result = await loop.run_in_executor(
                    _executor, self._fetch_feed, source, feed_name, url, 10
                )
                if isinstance(result, list):
                    articles.extend(result)
            except Exception as e:
                logger.warning(f"Feed error {source}/{feed_name}: {e}")

        for article in articles:
            sentiment = self._score_article(article)
            article.update(sentiment)

        return {
            "articles": articles,
            "source": source,
            "timestamp": datetime.now().isoformat(),
        }

    def _fetch_feed(self, source: str, feed_name: str, url: str, max_items: int) -> List[Dict]:
        """Parse a single RSS feed (runs in thread pool)."""
        try:
            feed = feedparser.parse(url)
            articles = []
            for entry in feed.entries[:max_items]:
                articles.append({
                    "title": entry.get("title", "").strip(),
                    "summary": (entry.get("summary", "") or "")[:300].strip(),
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "source": source,
                    "feed": feed_name,
                })
            return articles
        except Exception as e:
            logger.warning(f"RSS parse error ({url}): {e}")
            return []

    def _score_article(self, article: Dict) -> Dict[str, Any]:
        """Score sentiment for a single article using keyword analysis."""
        text = f"{article.get('title', '')} {article.get('summary', '')}".lower()

        bullish = sum(1 for kw in self.BULLISH_KEYWORDS if kw.lower() in text)
        bearish = sum(1 for kw in self.BEARISH_KEYWORDS if kw.lower() in text)
        volatile = sum(1 for kw in self.VOLATILITY_KEYWORDS if kw.lower() in text)

        if bullish > bearish:
            score = min(1.0, bullish * 0.25)
            label = "bullish"
        elif bearish > bullish:
            score = max(-1.0, bearish * -0.25)
            label = "bearish"
        else:
            score = 0.0
            label = "neutral"

        return {
            "sentiment_score": round(score, 2),
            "sentiment_label": label,
            "bullish_signals": bullish,
            "bearish_signals": bearish,
            "is_catalyst": volatile >= 2 or abs(score) > 0.5,
        }

    @staticmethod
    def _score_to_label(score: float) -> str:
        if score > 0.2:
            return "bullish"
        elif score < -0.2:
            return "bearish"
        return "neutral"
