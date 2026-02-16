"""
Sentiment Analyzer Agent
Analyzes market news headlines for sentiment scoring using Llama3.1.
Provides per-headline classification and aggregate impact analysis.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class SentimentAgent:
    """
    Analyzes news for market sentiment impacting Nifty50/Sensex/BankNifty.
    Uses Llama3.1 for NLP classification with chain-of-thought reasoning.
    """

    # Simple keyword-based fallback when Ollama unavailable
    POSITIVE_KEYWORDS = [
        "rally", "bullish", "surge", "gain", "positive", "rise", "up",
        "growth", "profit", "buyer", "record high", "breakout", "strong",
        "earnings beat", "upgrade", "optimistic", "recovery",
    ]
    NEGATIVE_KEYWORDS = [
        "crash", "bearish", "fall", "decline", "drop", "loss", "negative",
        "selloff", "sell-off", "panic", "fear", "correction", "weak",
        "downgrade", "recession", "slowdown", "miss", "pressure",
    ]

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client

    async def run(self, shared_state) -> Dict[str, Any]:
        """Analyze news from shared state and output sentiment scores."""
        start = time.time()
        news = shared_state.get("news", [])

        if not news:
            return {
                "sentiment_score": 0,
                "label": "neutral",
                "per_headline": [],
                "impact_analysis": "No news available for analysis.",
                "duration_ms": 0,
            }

        # Use Ollama if available, else keyword-based fallback
        if self.ollama and self.ollama.is_available:
            result = self._analyze_with_llm(news)
        else:
            result = self._analyze_with_keywords(news)

        result["duration_ms"] = (time.time() - start) * 1000

        # Update shared state
        shared_state.set("sentiment", result)
        return result

    def _analyze_with_llm(self, news: List[Dict]) -> Dict[str, Any]:
        """Use Llama3.1 for sophisticated sentiment analysis."""
        headlines = [n.get("title", "") for n in news if n.get("title")]
        headlines_text = "\n".join(f"- {h}" for h in headlines[:10])

        prompt = self.ollama.build_agent_prompt(
            agent_name="Sentiment Analyzer",
            steps=[
                f"Read these market news headlines:\n{headlines_text}",
                "Classify EACH headline as positive (+1), negative (-1), or neutral (0)",
                "Calculate an aggregate sentiment score (-1 to 1) as weighted average",
                "Analyze specific impact on BankNifty options (bullish for calls or puts?)",
                "Consider if any headline is a catalyst for intraday volatility",
            ],
            data={"headlines": headlines},
            output_fields=[
                "sentiment_score",
                "label",
                "per_headline",
                "impact_analysis",
                "volatility_catalyst",
            ],
        )

        result = self.ollama.chat_json(prompt)

        # Validate and normalize the response
        if not isinstance(result.get("sentiment_score"), (int, float)):
            result["sentiment_score"] = 0
        result["sentiment_score"] = max(-1, min(1, float(result.get("sentiment_score", 0))))
        result["label"] = self._score_to_label(result["sentiment_score"])

        if not isinstance(result.get("per_headline"), list):
            result["per_headline"] = [
                {"text": h, "score": 0, "label": "neutral"} for h in headlines
            ]

        return result

    def _analyze_with_keywords(self, news: List[Dict]) -> Dict[str, Any]:
        """Fallback keyword-based sentiment analysis."""
        per_headline = []
        total_score = 0

        for item in news:
            title = item.get("title", "").lower()
            summary = item.get("summary", "").lower()
            text = f"{title} {summary}"

            pos_count = sum(1 for kw in self.POSITIVE_KEYWORDS if kw in text)
            neg_count = sum(1 for kw in self.NEGATIVE_KEYWORDS if kw in text)

            if pos_count > neg_count:
                score = min(1.0, pos_count * 0.3)
                label = "positive"
            elif neg_count > pos_count:
                score = max(-1.0, neg_count * -0.3)
                label = "negative"
            else:
                score = 0
                label = "neutral"

            per_headline.append({
                "text": item.get("title", ""),
                "score": round(score, 2),
                "label": label,
                "source": item.get("source", ""),
            })
            total_score += score

        avg_score = round(total_score / len(per_headline), 3) if per_headline else 0

        # Generate impact analysis
        impact = self._generate_impact_analysis(avg_score, per_headline)

        return {
            "sentiment_score": avg_score,
            "label": self._score_to_label(avg_score),
            "per_headline": per_headline,
            "impact_analysis": impact,
            "volatility_catalyst": any(
                abs(h["score"]) > 0.6 for h in per_headline
            ),
            "method": "keyword_fallback",
        }

    def _generate_impact_analysis(self, score: float, headlines: List[Dict]) -> str:
        """Generate a textual impact analysis from sentiment data."""
        pos = sum(1 for h in headlines if h["label"] == "positive")
        neg = sum(1 for h in headlines if h["label"] == "negative")
        neu = sum(1 for h in headlines if h["label"] == "neutral")

        analysis = f"Out of {len(headlines)} headlines: {pos} positive, {neg} negative, {neu} neutral. "

        if score > 0.3:
            analysis += (
                "Overall bullish sentiment suggests favorable conditions for call options. "
                "BankNifty may see upward pressure. Consider call buying near support."
            )
        elif score < -0.3:
            analysis += (
                "Overall bearish sentiment signals caution. Put options may gain premium. "
                "Watch for breakdown below support levels. Hedge existing positions."
            )
        else:
            analysis += (
                "Mixed/neutral sentiment suggests range-bound trading. "
                "Straddle or strangle strategies may benefit from time decay. "
                "Wait for directional trigger before taking positions."
            )

        return analysis

    @staticmethod
    def _score_to_label(score: float) -> str:
        """Convert numeric score to label."""
        if score > 0.2:
            return "positive"
        elif score < -0.2:
            return "negative"
        return "neutral"
