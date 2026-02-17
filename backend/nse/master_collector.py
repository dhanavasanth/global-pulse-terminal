"""
NSE Master Data Collector
Unified orchestrator that coordinates all data collection modules.
Bloomberg-style comprehensive market data pipeline.
"""

import asyncio
import logging
import time
from datetime import datetime, time as dt_time
from typing import Any, Dict, List, Optional, Callable

logger = logging.getLogger(__name__)


class NSEMasterCollector:
    """
    Master orchestrator for all NSE data collection.

    Coordinates:
    - Equity data (indices, stocks, delivery)
    - Derivatives data (options chains, FII/DII)
    - Volatility data (VIX, IV analysis)
    - Market breadth (advance/decline, movers)
    - Global markets (US, Asia, Europe, commodities)
    - News & sentiment
    - Calculated metrics (Greeks, Volume Profile)

    Collection modes:
    - Real-time: Every 3-5 seconds (indices, VIX)
    - Periodic: Every 1-5 minutes (options chain, breadth)
    - EOD: Once per day (bhavcopy, delivery data)
    - Pre-market: 7:00-9:15 AM (global cues, GIFT Nifty)
    """

    MARKET_OPEN = dt_time(9, 15)
    MARKET_CLOSE = dt_time(15, 30)
    PRE_MARKET_START = dt_time(7, 0)

    def __init__(self, ollama_client=None):
        from .nse_client import NSEClient
        from .equity_collector import EquityCollector
        from .derivatives_collector import DerivativesCollector
        from .volatility_collector import VolatilityCollector
        from .market_breadth import MarketBreadthCollector
        from .global_markets import GlobalMarketsCollector
        from .news_collector import NewsCollector
        from .calculated_metrics import CalculatedMetrics

        # Core HTTP client
        self.nse_client = NSEClient()

        # Data collectors
        self.equity = EquityCollector(self.nse_client)
        self.derivatives = DerivativesCollector(self.nse_client)
        self.volatility = VolatilityCollector(self.nse_client)
        self.breadth = MarketBreadthCollector(self.nse_client)
        self.global_markets = GlobalMarketsCollector()
        self.news = NewsCollector(ollama_client)
        self.metrics = CalculatedMetrics()

        # State
        self._cache: Dict[str, Any] = {}
        self._cache_times: Dict[str, float] = {}
        self._running = False
        self._callbacks: List[Callable] = []
        self._collection_task: Optional[asyncio.Task] = None

    # ==================== Cache Management ====================

    def _set_cache(self, key: str, data: Any, ttl: int = 60):
        """Cache data with TTL."""
        self._cache[key] = {
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "ttl": ttl,
        }
        self._cache_times[key] = time.time()

    def _get_cache(self, key: str) -> Optional[Any]:
        """Get cached data if still valid."""
        if key not in self._cache:
            return None
        entry = self._cache[key]
        elapsed = time.time() - self._cache_times.get(key, 0)
        if elapsed > entry.get("ttl", 60):
            return None
        return entry.get("data")

    def get_cached(self, key: str) -> Optional[Dict]:
        """Public interface to get cached data with metadata."""
        if key not in self._cache:
            return None
        return self._cache[key]

    # ==================== Individual Collection Methods ====================

    async def collect_market_overview(self) -> Dict[str, Any]:
        """
        Bloomberg-style market overview.
        Combines indices, VIX, breadth, and market status.
        """
        cached = self._get_cache("market_overview")
        if cached:
            return cached

        try:
            indices_task = self.equity.collect_all_indices()
            status_task = self.equity.collect_market_status()
            vix_task = self.volatility.collect_india_vix()

            indices, status, vix = await asyncio.gather(
                indices_task, status_task, vix_task,
                return_exceptions=True,
            )

            result = {
                "indices": indices if not isinstance(indices, Exception) else {"error": str(indices)},
                "market_status": status if not isinstance(status, Exception) else {"error": str(status)},
                "vix": vix if not isinstance(vix, Exception) else {"error": str(vix)},
                "timestamp": datetime.now().isoformat(),
            }

            self._set_cache("market_overview", result, ttl=10)
            return result

        except Exception as e:
            logger.error(f"Market overview collection failed: {e}")
            return {"error": str(e)}

    async def collect_options_dashboard(self, symbol: str = "NIFTY") -> Dict[str, Any]:
        """
        Complete options analysis dashboard.
        Chain + Greeks + PCR + Max Pain + IV + Expected Move.
        """
        cache_key = f"options_{symbol}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached

        try:
            # Get options chain
            chain_data = await self.derivatives.collect_options_chain(symbol)

            if "error" in chain_data:
                return chain_data

            # Compute additional metrics
            greeks = self.metrics.compute_chain_greeks(chain_data)
            support_resistance = self.metrics.compute_oi_based_support_resistance(chain_data)
            straddle = self.metrics.compute_straddle_price(chain_data)

            # Expected move from ATM IV
            iv_data = chain_data.get("iv_data", {})
            atm_iv = iv_data.get("atm_iv_avg", 15)
            spot = chain_data.get("spot_price", 0)

            # Calculate days to current expiry
            current_expiry = chain_data.get("current_expiry", "")
            expiry_days = self.metrics._days_to_expiry(current_expiry)

            expected_move = self.metrics.compute_expected_move(spot, atm_iv, expiry_days)

            result = {
                "chain": chain_data,
                "greeks": greeks,
                "support_resistance": support_resistance,
                "straddle": straddle,
                "expected_move": expected_move,
                "timestamp": datetime.now().isoformat(),
            }

            self._set_cache(cache_key, result, ttl=30)
            return result

        except Exception as e:
            logger.error(f"Options dashboard collection failed: {e}")
            return {"error": str(e)}

    async def collect_institutional_flows(self) -> Dict[str, Any]:
        """FII/DII data combining cash and F&O segments."""
        cached = self._get_cache("institutional")
        if cached:
            return cached

        try:
            fii_dii = await self.derivatives.collect_fii_dii()
            self._set_cache("institutional", fii_dii, ttl=300)
            return fii_dii
        except Exception as e:
            logger.error(f"Institutional flows collection failed: {e}")
            return {"error": str(e)}

    async def collect_market_pulse(self) -> Dict[str, Any]:
        """
        Market pulse: breadth + movers + activity.
        Updated every 1-2 minutes during market hours.
        """
        cached = self._get_cache("market_pulse")
        if cached:
            return cached

        try:
            pulse = await self.breadth.collect_full_pulse()
            self._set_cache("market_pulse", pulse, ttl=60)
            return pulse
        except Exception as e:
            logger.error(f"Market pulse collection failed: {e}")
            return {"error": str(e)}

    async def collect_global_cues(self) -> Dict[str, Any]:
        """Global markets data for correlation analysis."""
        cached = self._get_cache("global_cues")
        if cached:
            return cached

        try:
            global_data = await self.global_markets.collect_all()
            self._set_cache("global_cues", global_data, ttl=120)
            return global_data
        except Exception as e:
            logger.error(f"Global cues collection failed: {e}")
            return {"error": str(e)}

    async def collect_news_sentiment(self) -> Dict[str, Any]:
        """News aggregation with sentiment analysis."""
        cached = self._get_cache("news")
        if cached:
            return cached

        try:
            news = await self.news.collect_all_news()
            self._set_cache("news", news, ttl=300)
            return news
        except Exception as e:
            logger.error(f"News collection failed: {e}")
            return {"error": str(e)}

    async def collect_sectoral_analysis(self) -> Dict[str, Any]:
        """Sectoral performance and rotation analysis."""
        cached = self._get_cache("sectors")
        if cached:
            return cached

        try:
            sectors = await self.equity.collect_sectoral_performance()
            self._set_cache("sectors", sectors, ttl=60)
            return sectors
        except Exception as e:
            logger.error(f"Sectoral analysis failed: {e}")
            return {"error": str(e)}

    async def collect_stock_deep_dive(self, symbol: str) -> Dict[str, Any]:
        """
        Deep dive into a single stock.
        Quote + delivery + options + technicals.
        """
        try:
            quote_task = self.equity.collect_equity_quote(symbol)
            delivery_task = self.equity.collect_delivery_data(symbol)

            quote, delivery = await asyncio.gather(
                quote_task, delivery_task,
                return_exceptions=True,
            )

            result = {
                "quote": quote if not isinstance(quote, Exception) else {"error": str(quote)},
                "delivery": delivery if not isinstance(delivery, Exception) else {"error": str(delivery)},
                "timestamp": datetime.now().isoformat(),
            }

            return result
        except Exception as e:
            return {"error": str(e)}

    # ==================== Full Collection Cycle ====================

    async def collect_full_cycle(self) -> Dict[str, Any]:
        """
        Run a complete data collection cycle.
        Collects everything in parallel for maximum speed.
        """
        start = time.time()
        logger.info("Starting full collection cycle...")

        # Phase 1: Core market data (fast, critical)
        phase1_tasks = {
            "market_overview": self.collect_market_overview(),
            "market_pulse": self.collect_market_pulse(),
            "sectors": self.collect_sectoral_analysis(),
        }

        phase1_results = {}
        results = await asyncio.gather(
            *phase1_tasks.values(), return_exceptions=True
        )
        for key, result in zip(phase1_tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Phase 1 - {key} failed: {result}")
                phase1_results[key] = {"error": str(result)}
            else:
                phase1_results[key] = result

        # Phase 2: Derivatives + institutional (important, slightly slower)
        phase2_tasks = {
            "nifty_options": self.collect_options_dashboard("NIFTY"),
            "banknifty_options": self.collect_options_dashboard("BANKNIFTY"),
            "institutional": self.collect_institutional_flows(),
        }

        phase2_results = {}
        results = await asyncio.gather(
            *phase2_tasks.values(), return_exceptions=True
        )
        for key, result in zip(phase2_tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Phase 2 - {key} failed: {result}")
                phase2_results[key] = {"error": str(result)}
            else:
                phase2_results[key] = result

        # Phase 3: Global + news (external sources, can be slow)
        phase3_tasks = {
            "global_cues": self.collect_global_cues(),
            "news": self.collect_news_sentiment(),
        }

        phase3_results = {}
        results = await asyncio.gather(
            *phase3_tasks.values(), return_exceptions=True
        )
        for key, result in zip(phase3_tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Phase 3 - {key} failed: {result}")
                phase3_results[key] = {"error": str(result)}
            else:
                phase3_results[key] = result

        total_ms = (time.time() - start) * 1000

        cycle_result = {
            **phase1_results,
            **phase2_results,
            **phase3_results,
            "cycle_duration_ms": round(total_ms, 0),
            "timestamp": datetime.now().isoformat(),
        }

        # Notify callbacks
        for callback in self._callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(cycle_result)
                else:
                    callback(cycle_result)
            except Exception as e:
                logger.error(f"Callback error: {e}")

        logger.info(f"Full cycle completed in {total_ms:.0f}ms")
        return cycle_result

    # ==================== Continuous Collection ====================

    def add_callback(self, callback: Callable):
        """Register a callback for cycle completion."""
        self._callbacks.append(callback)

    async def start_continuous(self, interval_seconds: int = 60):
        """Start continuous data collection."""
        if self._running:
            logger.warning("Continuous collection already running")
            return

        self._running = True
        self._collection_task = asyncio.create_task(
            self._collection_loop(interval_seconds)
        )
        logger.info(f"Continuous collection started (interval: {interval_seconds}s)")

    async def stop_continuous(self):
        """Stop continuous collection."""
        self._running = False
        if self._collection_task:
            self._collection_task.cancel()
            try:
                await self._collection_task
            except asyncio.CancelledError:
                pass
        logger.info("Continuous collection stopped")

    async def _collection_loop(self, interval: int):
        """Main collection loop."""
        while self._running:
            try:
                now = datetime.now().time()

                if self.PRE_MARKET_START <= now < self.MARKET_OPEN:
                    # Pre-market: global cues + pre-open data
                    logger.info("Pre-market collection...")
                    await asyncio.gather(
                        self.collect_global_cues(),
                        self.collect_news_sentiment(),
                        return_exceptions=True,
                    )
                elif self.MARKET_OPEN <= now <= self.MARKET_CLOSE:
                    # Market hours: full cycle
                    await self.collect_full_cycle()
                else:
                    # After hours: just global + news
                    await asyncio.gather(
                        self.collect_global_cues(),
                        self.collect_news_sentiment(),
                        return_exceptions=True,
                    )

                await asyncio.sleep(interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Collection loop error: {e}")
                await asyncio.sleep(30)

    @property
    def is_running(self) -> bool:
        return self._running

    def get_status(self) -> Dict[str, Any]:
        """Get collector status."""
        now = datetime.now().time()
        is_market = self.MARKET_OPEN <= now <= self.MARKET_CLOSE
        is_pre_market = self.PRE_MARKET_START <= now < self.MARKET_OPEN

        return {
            "running": self._running,
            "is_market_hours": is_market,
            "is_pre_market": is_pre_market,
            "current_time": datetime.now().isoformat(),
            "cache_keys": list(self._cache.keys()),
            "cache_sizes": {k: len(str(v)) for k, v in self._cache.items()},
        }

    def get_snapshot(self) -> Dict[str, Any]:
        """Get current cached snapshot of all data."""
        return {
            key: entry.get("data") if isinstance(entry, dict) else entry
            for key, entry in self._cache.items()
        }

    async def close(self):
        """Cleanup resources."""
        await self.stop_continuous()
        await self.nse_client.close()
