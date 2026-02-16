"""
Pyth Network Price Service
Real-time cryptocurrency and forex prices from Pyth Hermes
"""

import os
import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Pyth Hermes endpoint (free, no API key needed)
PYTH_HERMES_URL = "https://hermes.pyth.network"

# Price feed IDs for popular assets
# Full list: https://pyth.network/developers/price-feed-ids
PRICE_FEEDS = {
    # Crypto
    "BTC": "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "ETH": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "SOL": "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "BNB": "2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f",
    "XRP": "ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8",
    "ADA": "2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d",
    "AVAX": "93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7",
    "DOGE": "dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c",
    "DOT": "ca3eed9b267c94db730d4ca78ea39adbe5d33aea71ee5c63e35adb51c0f3eb42",
    "MATIC": "5de33440f6c8ee339a1fb10c45d7830e97f16e04f5bd9fd9dbf3e98a8ba57a9e",
    "LINK": "8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221",
    "UNI": "78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501",
    "ATOM": "b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819",
    "LTC": "6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54",
    
    # Forex
    "EUR/USD": "a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b",
    "GBP/USD": "84c2dde9633d93d1bcad84e60dc37b93c3c8c5ab9c989f1f8e0c988c7be80a9a",
    "USD/JPY": "ef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52",
    "AUD/USD": "67a6f93030f94e0e4b0a1a5c3c1a9b0449be44e574b7a2d4b5c6cbb6c3b3c4c5",
    
    # Commodities
    "GOLD": "765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
    "SILVER": "f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e",
    "WTI": "c96458d393fe9deb7a7d63a0ac41e2898a67a7750dbd166673c4e8e4b4c2f9a5",
}

# Cache
_price_cache: Dict[str, tuple] = {}

def _get_cached_price(symbol: str, max_age_seconds: int = 5) -> Optional[Dict]:
    """Get cached price if fresh enough"""
    if symbol in _price_cache:
        data, timestamp = _price_cache[symbol]
        if (datetime.now() - timestamp).total_seconds() < max_age_seconds:
            return data
    return None

def _cache_price(symbol: str, data: Dict):
    """Cache price data"""
    _price_cache[symbol] = (data, datetime.now())

async def get_price(symbol: str) -> Optional[Dict]:
    """Get real-time price for a symbol"""
    symbol = symbol.upper()
    
    # Check cache first
    cached = _get_cached_price(symbol)
    if cached:
        return cached
    
    # Get price feed ID
    feed_id = PRICE_FEEDS.get(symbol)
    if not feed_id:
        logger.warning(f"No Pyth feed ID for symbol: {symbol}")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{PYTH_HERMES_URL}/v2/updates/price/latest",
                params={"ids[]": feed_id}
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("parsed") and len(data["parsed"]) > 0:
                price_data = data["parsed"][0]
                price_info = price_data.get("price", {})
                
                # Convert from fixed-point
                price = int(price_info.get("price", 0))
                expo = int(price_info.get("expo", 0))
                actual_price = price * (10 ** expo)
                
                ema_info = price_data.get("ema_price", {})
                ema_price = int(ema_info.get("price", 0)) * (10 ** int(ema_info.get("expo", 0)))
                
                result = {
                    "symbol": symbol,
                    "price": actual_price,
                    "ema_price": ema_price,
                    "confidence": int(price_info.get("conf", 0)) * (10 ** expo),
                    "publish_time": price_data.get("price", {}).get("publish_time"),
                    "source": "pyth"
                }
                
                _cache_price(symbol, result)
                return result
                
    except Exception as e:
        logger.error(f"Pyth price fetch failed for {symbol}: {e}")
        return None
    
    return None

async def get_multiple_prices(symbols: List[str]) -> Dict[str, Dict]:
    """Get prices for multiple symbols"""
    results = {}
    
    # Filter to valid symbols
    valid_symbols = [s.upper() for s in symbols if s.upper() in PRICE_FEEDS]
    
    if not valid_symbols:
        return results
    
    feed_ids = [PRICE_FEEDS[s] for s in valid_symbols]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Build query params
            params = [("ids[]", fid) for fid in feed_ids]
            response = await client.get(
                f"{PYTH_HERMES_URL}/v2/updates/price/latest",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("parsed"):
                for i, price_data in enumerate(data["parsed"]):
                    if i < len(valid_symbols):
                        symbol = valid_symbols[i]
                        price_info = price_data.get("price", {})
                        
                        price = int(price_info.get("price", 0))
                        expo = int(price_info.get("expo", 0))
                        actual_price = price * (10 ** expo)
                        
                        results[symbol] = {
                            "symbol": symbol,
                            "price": actual_price,
                            "publish_time": price_info.get("publish_time"),
                            "source": "pyth"
                        }
                        _cache_price(symbol, results[symbol])
                        
    except Exception as e:
        logger.error(f"Pyth batch price fetch failed: {e}")
    
    return results

def get_available_symbols() -> List[str]:
    """Get list of available Pyth price feeds"""
    return list(PRICE_FEEDS.keys())
