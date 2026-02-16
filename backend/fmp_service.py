"""
Financial Modeling Prep (FMP) API Service
Provides stock data with caching and rate limiting
"""

import os
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# FMP API Configuration
FMP_BASE_URL = "https://financialmodelingprep.com/stable"
FMP_API_KEY = os.getenv("FMP_API_KEY", "demo")  # Use 'demo' for testing

# Simple in-memory cache
_cache: Dict[str, tuple] = {}  # {key: (data, expiry_time)}

def _get_cache(key: str, ttl_seconds: int = 300) -> Optional[Any]:
    """Get cached data if not expired"""
    if key in _cache:
        data, expiry = _cache[key]
        if datetime.now() < expiry:
            return data
        del _cache[key]
    return None

def _set_cache(key: str, data: Any, ttl_seconds: int = 300):
    """Set cache with TTL"""
    _cache[key] = (data, datetime.now() + timedelta(seconds=ttl_seconds))

async def _fetch_fmp(endpoint: str, params: Dict[str, Any] = None, ttl: int = 300) -> Any:
    """Fetch from FMP API with caching"""
    params = params or {}
    params["apikey"] = FMP_API_KEY
    
    # Create cache key
    cache_key = f"{endpoint}:{str(sorted(params.items()))}"
    
    # Check cache
    cached = _get_cache(cache_key, ttl)
    if cached is not None:
        return cached
    
    # Fetch from API
    url = f"{FMP_BASE_URL}/{endpoint}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Cache the result
            _set_cache(cache_key, data, ttl)
            return data
    except httpx.HTTPStatusError as e:
        logger.error(f"FMP API error: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        logger.error(f"FMP request failed: {e}")
        raise

# ============= API Functions =============

async def search_symbols(query: str, limit: int = 10) -> List[Dict]:
    """Search for stock symbols"""
    return await _fetch_fmp("search", {"query": query, "limit": limit}, ttl=3600)

async def get_profile(symbol: str) -> Dict:
    """Get company profile"""
    data = await _fetch_fmp("profile", {"symbol": symbol}, ttl=3600)
    return data[0] if data else {}

async def get_quote(symbol: str) -> Dict:
    """Get real-time quote"""
    data = await _fetch_fmp("quote", {"symbol": symbol}, ttl=60)
    return data[0] if data else {}

async def get_batch_quotes(symbols: List[str]) -> List[Dict]:
    """Get quotes for multiple symbols"""
    return await _fetch_fmp("batch-quote", {"symbols": ",".join(symbols)}, ttl=60)

async def get_key_metrics(symbol: str, period: str = "annual") -> List[Dict]:
    """Get key metrics (P/E, EPS, etc.)"""
    return await _fetch_fmp("key-metrics", {"symbol": symbol, "period": period}, ttl=3600)

async def get_key_metrics_ttm(symbol: str) -> Dict:
    """Get TTM key metrics"""
    data = await _fetch_fmp("key-metrics-ttm", {"symbol": symbol}, ttl=3600)
    return data[0] if data else {}

async def get_ratios(symbol: str, period: str = "annual") -> List[Dict]:
    """Get financial ratios"""
    return await _fetch_fmp("ratios", {"symbol": symbol, "period": period}, ttl=3600)

async def get_ratios_ttm(symbol: str) -> Dict:
    """Get TTM financial ratios"""
    data = await _fetch_fmp("ratios-ttm", {"symbol": symbol}, ttl=3600)
    return data[0] if data else {}

async def get_income_statement(symbol: str, period: str = "annual", limit: int = 5) -> List[Dict]:
    """Get income statements"""
    return await _fetch_fmp("income-statement", {"symbol": symbol, "period": period, "limit": limit}, ttl=3600)

async def get_balance_sheet(symbol: str, period: str = "annual", limit: int = 5) -> List[Dict]:
    """Get balance sheet statements"""
    return await _fetch_fmp("balance-sheet-statement", {"symbol": symbol, "period": period, "limit": limit}, ttl=3600)

async def get_cash_flow(symbol: str, period: str = "annual", limit: int = 5) -> List[Dict]:
    """Get cash flow statements"""
    return await _fetch_fmp("cash-flow-statement", {"symbol": symbol, "period": period, "limit": limit}, ttl=3600)

async def get_historical_price(symbol: str, from_date: str = None, to_date: str = None) -> Dict:
    """Get historical price data"""
    params = {"symbol": symbol}
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date
    return await _fetch_fmp("historical-price-eod/full", params, ttl=300)

async def get_price_change(symbol: str) -> Dict:
    """Get price change percentages"""
    data = await _fetch_fmp("stock-price-change", {"symbol": symbol}, ttl=300)
    return data[0] if data else {}

async def get_earnings_history(symbol: str, limit: int = 10) -> List[Dict]:
    """Get historical earnings"""
    return await _fetch_fmp("earnings-historical", {"symbol": symbol, "limit": limit}, ttl=3600)

async def get_dividends(symbol: str) -> List[Dict]:
    """Get dividend history"""
    return await _fetch_fmp("historical-price-dividend", {"symbol": symbol}, ttl=3600)

async def get_stock_splits(symbol: str) -> List[Dict]:
    """Get stock splits history"""
    return await _fetch_fmp("historical-stock-splits", {"symbol": symbol}, ttl=3600)

async def get_insider_trading(symbol: str, limit: int = 20) -> List[Dict]:
    """Get insider trading data"""
    return await _fetch_fmp("insider-trading", {"symbol": symbol, "limit": limit}, ttl=1800)

async def get_institutional_holders(symbol: str) -> List[Dict]:
    """Get institutional ownership"""
    return await _fetch_fmp("institutional-ownership", {"symbol": symbol}, ttl=3600)

async def get_key_executives(symbol: str) -> List[Dict]:
    """Get company executives"""
    return await _fetch_fmp("key-executives", {"symbol": symbol}, ttl=86400)

async def get_stock_peers(symbol: str) -> List[str]:
    """Get peer companies"""
    data = await _fetch_fmp("stock-peers", {"symbol": symbol}, ttl=86400)
    return data[0].get("peersList", []) if data else []

async def get_price_target(symbol: str) -> List[Dict]:
    """Get analyst price targets"""
    return await _fetch_fmp("price-target", {"symbol": symbol}, ttl=3600)

async def get_sec_filings(symbol: str, limit: int = 20) -> List[Dict]:
    """Get SEC filings"""
    return await _fetch_fmp("sec-filings", {"symbol": symbol, "limit": limit}, ttl=3600)

async def get_revenue_segmentation(symbol: str) -> List[Dict]:
    """Get revenue by product segment"""
    return await _fetch_fmp("revenue-product-segmentation", {"symbol": symbol}, ttl=86400)

async def get_revenue_geography(symbol: str) -> List[Dict]:
    """Get revenue by geography"""
    return await _fetch_fmp("revenue-geographic-segmentation", {"symbol": symbol}, ttl=86400)

async def get_financial_scores(symbol: str) -> Dict:
    """Get Altman Z-Score and Piotroski score"""
    data = await _fetch_fmp("financial-scores", {"symbol": symbol}, ttl=86400)
    return data[0] if data else {}

async def get_market_overview() -> List[Dict]:
    """Get market overview (major indices)"""
    return await _fetch_fmp("quote", {"symbol": "^GSPC,^DJI,^IXIC,^RUT"}, ttl=60)
