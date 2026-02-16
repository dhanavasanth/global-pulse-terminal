"""
NSE HTTP Client
Session-managed HTTP client for NSE India APIs.
Handles cookie management, rate limiting, and retry logic.
NSE requires proper browser-like session with cookies from initial page load.
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)


class NSEClient:
    """
    HTTP client for NSE India APIs with session/cookie management.

    NSE blocks requests without proper cookies. This client:
    1. Visits nseindia.com to get session cookies
    2. Reuses cookies for subsequent API calls
    3. Refreshes cookies when they expire (~5 min)
    4. Rate limits to avoid getting blocked
    """

    BASE_URL = "https://www.nseindia.com"
    ARCHIVE_URL = "https://archives.nseindia.com"

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nseindia.com/",
        "Connection": "keep-alive",
    }

    # API endpoints
    ENDPOINTS = {
        # Equity
        "equity_quote": "/api/quote-equity?symbol={symbol}",
        "equity_trade_info": "/api/quote-equity?symbol={symbol}&section=trade_info",
        "equity_master": "/api/equity-master",
        "market_status": "/api/marketStatus",
        "market_turnover": "/api/market-turnover",

        # Indices
        "all_indices": "/api/allIndices",
        "index_stocks": "/api/equity-stockIndices?index={index}",

        # Pre-market
        "pre_open": "/api/market-data-pre-open?key={key}",

        # Options Chain
        "option_chain_indices": "/api/option-chain-indices?symbol={symbol}",
        "option_chain_equities": "/api/option-chain-equities?symbol={symbol}",

        # Derivatives
        "equity_derivatives": "/api/equity-derivatives?index={symbol}",

        # FII/DII
        "fii_dii_trading": "/api/fiidiiTrading",

        # Corporate Actions
        "corporate_actions": "/api/corporates-corporateActions?index=equities",
        "board_meetings": "/api/corporate-board-meetings?index=equities",
        "bulk_deals": "/api/snapshot-capital-market-largedeal",

        # Market Breadth
        "advances_declines": "/api/live-analysis-variations?index=gainers",
        "most_active": "/api/live-analysis-most-active-securities?index=volume",

        # VIX
        "vix_history": "/api/historical/vixhistory?from={from_date}&to={to_date}",

        # Holiday
        "holiday_master": "/api/holiday-master?type=trading",
    }

    def __init__(self, max_retries: int = 3, rate_limit_delay: float = 0.35):
        self._client: Optional[httpx.AsyncClient] = None
        self._cookies: Dict[str, str] = {}
        self._cookie_time: float = 0
        self._cookie_ttl: int = 240  # 4 minutes (NSE cookies expire in ~5 min)
        self._max_retries = max_retries
        self._rate_limit_delay = rate_limit_delay
        self._last_request_time: float = 0
        self._lock = asyncio.Lock()

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.HEADERS,
                timeout=httpx.Timeout(30.0, connect=10.0),
                follow_redirects=True,
                verify=True,
            )
        return self._client

    async def _refresh_cookies(self):
        """Visit NSE homepage to get fresh session cookies."""
        async with self._lock:
            # Check if cookies are still fresh (another coroutine may have refreshed)
            if time.time() - self._cookie_time < self._cookie_ttl:
                return

            client = await self._get_client()
            try:
                resp = await client.get(
                    self.BASE_URL,
                    headers={**self.HEADERS, "Accept": "text/html"},
                )
                if resp.status_code == 200:
                    self._cookies = dict(resp.cookies)
                    self._cookie_time = time.time()
                    logger.info(f"NSE cookies refreshed: {len(self._cookies)} cookies")
                else:
                    logger.warning(f"NSE cookie refresh failed: HTTP {resp.status_code}")
            except Exception as e:
                logger.error(f"NSE cookie refresh error: {e}")

    async def _ensure_cookies(self):
        """Ensure we have valid cookies."""
        if time.time() - self._cookie_time >= self._cookie_ttl:
            await self._refresh_cookies()

    async def _rate_limit(self):
        """Apply rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """
        Make a GET request to NSE API with automatic cookie management and retries.

        Args:
            endpoint: API endpoint path (e.g., "/api/allIndices")
            params: Optional query parameters

        Returns:
            JSON response dict or None on failure
        """
        await self._ensure_cookies()
        await self._rate_limit()

        client = await self._get_client()
        url = f"{self.BASE_URL}{endpoint}"

        for attempt in range(self._max_retries):
            try:
                resp = await client.get(
                    url,
                    params=params,
                    cookies=self._cookies,
                )

                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 401 or resp.status_code == 403:
                    # Cookie expired, refresh
                    logger.info(f"NSE auth error ({resp.status_code}), refreshing cookies")
                    self._cookie_time = 0  # Force refresh
                    await self._refresh_cookies()
                else:
                    logger.warning(f"NSE API {endpoint}: HTTP {resp.status_code}")

            except httpx.TimeoutException:
                logger.warning(f"NSE API timeout (attempt {attempt + 1}): {endpoint}")
            except Exception as e:
                logger.error(f"NSE API error (attempt {attempt + 1}): {e}")

            if attempt < self._max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

        return None

    async def get_endpoint(self, endpoint_key: str, **kwargs) -> Optional[Dict]:
        """
        Fetch data from a named endpoint.

        Args:
            endpoint_key: Key from ENDPOINTS dict
            **kwargs: Format parameters for the URL template

        Returns:
            JSON response dict or None
        """
        template = self.ENDPOINTS.get(endpoint_key)
        if not template:
            logger.error(f"Unknown endpoint: {endpoint_key}")
            return None

        path = template.format(**kwargs) if kwargs else template
        return await self.get(path)

    async def download_csv(self, url: str) -> Optional[bytes]:
        """Download a CSV/ZIP file from NSE archives."""
        await self._ensure_cookies()
        await self._rate_limit()

        client = await self._get_client()
        for attempt in range(self._max_retries):
            try:
                resp = await client.get(url, cookies=self._cookies)
                if resp.status_code == 200:
                    return resp.content
                logger.warning(f"Download failed: HTTP {resp.status_code} for {url}")
            except Exception as e:
                logger.error(f"Download error (attempt {attempt + 1}): {e}")

            if attempt < self._max_retries - 1:
                await asyncio.sleep(2 ** attempt)

        return None

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    # Convenience methods for common data fetches

    async def get_all_indices(self) -> Optional[Dict]:
        """Get all NSE indices data including VIX."""
        return await self.get_endpoint("all_indices")

    async def get_equity_quote(self, symbol: str) -> Optional[Dict]:
        """Get detailed equity quote for a symbol."""
        return await self.get_endpoint("equity_quote", symbol=symbol)

    async def get_option_chain(self, symbol: str, is_index: bool = True) -> Optional[Dict]:
        """Get complete options chain for a symbol."""
        key = "option_chain_indices" if is_index else "option_chain_equities"
        return await self.get_endpoint(key, symbol=symbol)

    async def get_fii_dii(self) -> Optional[Dict]:
        """Get FII/DII trading activity."""
        return await self.get_endpoint("fii_dii_trading")

    async def get_pre_open(self, key: str = "ALL") -> Optional[Dict]:
        """Get pre-market data."""
        return await self.get_endpoint("pre_open", key=key)

    async def get_market_status(self) -> Optional[Dict]:
        """Get current market status."""
        return await self.get_endpoint("market_status")

    async def get_bulk_deals(self) -> Optional[Dict]:
        """Get bulk/block deals."""
        return await self.get_endpoint("bulk_deals")

    async def get_corporate_actions(self) -> Optional[Dict]:
        """Get corporate actions."""
        return await self.get_endpoint("corporate_actions")
