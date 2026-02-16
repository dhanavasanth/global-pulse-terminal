"""
NSE Equity Data Collector
Collects equity bhavcopy, live quotes, delivery data, bulk/block deals,
corporate actions, and index data from NSE India.
"""

import asyncio
import io
import logging
import zipfile
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)


class EquityCollector:
    """
    Collects all equity-related data from NSE.

    Data collected:
    - Live index data (Nifty 50, Bank Nifty, all sectoral indices)
    - Individual stock quotes with trade info
    - Pre-market data
    - Delivery percentage data
    - Bulk & block deals
    - Corporate actions (dividends, splits, bonus)
    - Board meetings
    - Market turnover
    """

    # All major NSE indices
    INDICES = [
        "NIFTY 50", "NIFTY BANK", "NIFTY IT", "NIFTY AUTO",
        "NIFTY PHARMA", "NIFTY FMCG", "NIFTY METAL", "NIFTY REALTY",
        "NIFTY ENERGY", "NIFTY INFRA", "NIFTY PSE", "NIFTY MEDIA",
        "NIFTY PRIVATE BANK", "NIFTY PSU BANK", "NIFTY MIDCAP 50",
        "NIFTY SMLCAP 50", "NIFTY NEXT 50", "NIFTY 100", "NIFTY 200",
        "NIFTY 500", "NIFTY FINANCIAL SERVICES",
    ]

    # Nifty 50 stocks for quick access
    NIFTY50_STOCKS = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
        "HINDUNILVR", "ITC", "SBIN", "BHARTIARTL", "KOTAKBANK",
        "LT", "AXISBANK", "BAJFINANCE", "ASIANPAINT", "MARUTI",
        "TITAN", "SUNPHARMA", "ULTRACEMCO", "NTPC", "WIPRO",
        "POWERGRID", "M&M", "TATAMOTORS", "JSWSTEEL", "TATASTEEL",
        "ADANIENT", "BAJAJFINSV", "HCLTECH", "NESTLEIND", "TECHM",
        "INDUSINDBK", "ONGC", "COALINDIA", "GRASIM", "DIVISLAB",
        "BPCL", "BRITANNIA", "CIPLA", "DRREDDY", "EICHERMOT",
        "APOLLOHOSP", "HEROMOTOCO", "SBILIFE", "BAJAJ-AUTO", "TATACONSUM",
        "ADANIPORTS", "HDFCLIFE", "UPL", "LTIM", "HINDALCO",
    ]

    def __init__(self, nse_client):
        self.nse = nse_client

    async def collect_all_indices(self) -> Dict[str, Any]:
        """
        Fetch all NSE indices with real-time data.
        Returns comprehensive index data including PE, PB, dividend yield.
        """
        data = await self.nse.get_all_indices()
        if not data or "data" not in data:
            return {"indices": [], "timestamp": datetime.now().isoformat()}

        indices = []
        for item in data["data"]:
            indices.append({
                "name": item.get("index", ""),
                "last": item.get("last", 0),
                "open": item.get("open", 0),
                "high": item.get("high", 0),
                "low": item.get("low", 0),
                "prev_close": item.get("previousClose", 0),
                "change": item.get("variation", 0),
                "pct_change": item.get("percentChange", 0),
                "year_high": item.get("yearHigh", 0),
                "year_low": item.get("yearLow", 0),
                "pe": item.get("pe", ""),
                "pb": item.get("pb", ""),
                "div_yield": item.get("dy", ""),
                "advances": item.get("advances", 0),
                "declines": item.get("declines", 0),
                "unchanged": item.get("unchanged", 0),
            })

        # Extract key indices
        key_indices = {}
        for idx in indices:
            name = idx["name"]
            if name in ["NIFTY 50", "NIFTY BANK", "INDIA VIX",
                        "NIFTY IT", "NIFTY PHARMA", "NIFTY AUTO",
                        "NIFTY FMCG", "NIFTY METAL", "NIFTY FINANCIAL SERVICES"]:
                key_indices[name] = idx

        return {
            "all_indices": indices,
            "key_indices": key_indices,
            "market_breadth": {
                "advances": sum(i.get("advances", 0) for i in indices if i["name"] == "NIFTY 50"),
                "declines": sum(i.get("declines", 0) for i in indices if i["name"] == "NIFTY 50"),
                "unchanged": sum(i.get("unchanged", 0) for i in indices if i["name"] == "NIFTY 50"),
            },
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
        }

    async def collect_index_stocks(self, index_name: str = "NIFTY 50") -> Dict[str, Any]:
        """Fetch all stocks in a specific index with their data."""
        data = await self.nse.get_endpoint("index_stocks", index=index_name.replace(" ", "%20"))
        if not data or "data" not in data:
            return {"stocks": [], "index": index_name}

        stocks = []
        for item in data["data"]:
            stocks.append({
                "symbol": item.get("symbol", ""),
                "company": item.get("meta", {}).get("companyName", "") if isinstance(item.get("meta"), dict) else "",
                "industry": item.get("meta", {}).get("industry", "") if isinstance(item.get("meta"), dict) else "",
                "last": item.get("lastPrice", 0),
                "open": item.get("open", 0),
                "high": item.get("dayHigh", 0),
                "low": item.get("dayLow", 0),
                "prev_close": item.get("previousClose", 0),
                "change": item.get("change", 0),
                "pct_change": item.get("pChange", 0),
                "total_traded_volume": item.get("totalTradedVolume", 0),
                "total_traded_value": item.get("totalTradedValue", 0),
                "year_high": item.get("yearHigh", 0),
                "year_low": item.get("yearLow", 0),
                "pe": item.get("perChange365d", 0),
            })

        return {
            "stocks": stocks,
            "index": index_name,
            "index_value": data.get("advance", {}).get("value", 0) if isinstance(data.get("advance"), dict) else 0,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_equity_quote(self, symbol: str) -> Dict[str, Any]:
        """
        Get comprehensive quote for a single stock.
        Includes price, volume, VWAP, circuit limits, 52-week data.
        """
        data = await self.nse.get_equity_quote(symbol.upper())
        if not data:
            return {"symbol": symbol, "error": "No data available"}

        info = data.get("info", {})
        price_info = data.get("priceInfo", {})
        security_info = data.get("securityInfo", {})
        metadata = data.get("metadata", {})

        return {
            "symbol": info.get("symbol", symbol),
            "company_name": info.get("companyName", ""),
            "industry": info.get("industry", ""),
            "isin": metadata.get("isin", ""),
            "series": metadata.get("series", ""),
            "last_price": price_info.get("lastPrice", 0),
            "open": price_info.get("open", 0),
            "high": price_info.get("intraDayHighLow", {}).get("max", 0),
            "low": price_info.get("intraDayHighLow", {}).get("min", 0),
            "close": price_info.get("close", 0),
            "prev_close": price_info.get("previousClose", 0),
            "change": price_info.get("change", 0),
            "pct_change": price_info.get("pChange", 0),
            "vwap": price_info.get("vwap", 0),
            "total_buy_qty": security_info.get("totalBuyQuantity", 0),
            "total_sell_qty": security_info.get("totalSellQuantity", 0),
            "upper_circuit": price_info.get("upperCP", ""),
            "lower_circuit": price_info.get("lowerCP", ""),
            "year_high": price_info.get("weekHighLow", {}).get("max", 0),
            "year_low": price_info.get("weekHighLow", {}).get("min", 0),
            "face_value": security_info.get("faceValue", 0),
            "listing_date": metadata.get("listingDate", ""),
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_pre_open_data(self) -> Dict[str, Any]:
        """
        Fetch pre-market data (8:00 AM - 9:15 AM).
        Shows IEP, total buy/sell qty, implied open.
        """
        data = await self.nse.get_pre_open("ALL")
        if not data or "data" not in data:
            return {"stocks": [], "timestamp": datetime.now().isoformat()}

        stocks = []
        for item in data.get("data", []):
            metadata = item.get("metadata", {})
            detail = item.get("detail", {})
            stocks.append({
                "symbol": metadata.get("symbol", ""),
                "iep": metadata.get("iep", 0),  # Indicative Equilibrium Price
                "change": metadata.get("change", 0),
                "pct_change": metadata.get("pChange", 0),
                "prev_close": metadata.get("previousClose", 0),
                "final_price": metadata.get("finalPrice", 0),
                "final_quantity": metadata.get("finalQuantity", 0),
                "total_buy_qty": detail.get("totalBuyQuantity", 0),
                "total_sell_qty": detail.get("totalSellQuantity", 0),
                "market_cap": metadata.get("marketCap", 0),
                "year_high": metadata.get("yearHigh", 0),
                "year_low": metadata.get("yearLow", 0),
            })

        # Sort by % change for top movers
        stocks.sort(key=lambda x: abs(x.get("pct_change", 0)), reverse=True)

        return {
            "stocks": stocks,
            "top_gainers": [s for s in stocks if s.get("pct_change", 0) > 0][:10],
            "top_losers": [s for s in stocks if s.get("pct_change", 0) < 0][:10],
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_bulk_deals(self) -> Dict[str, Any]:
        """Fetch bulk and block deals showing institutional activity."""
        data = await self.nse.get_bulk_deals()
        if not data or "data" not in data:
            return {"deals": [], "timestamp": datetime.now().isoformat()}

        deals = []
        for item in data.get("data", []):
            deals.append({
                "symbol": item.get("symbol", ""),
                "client_name": item.get("clientName", ""),
                "deal_type": item.get("buySell", ""),  # BUY/SELL
                "quantity": item.get("quantity", 0),
                "price": item.get("price", 0),
                "remarks": item.get("remarks", ""),
                "date": item.get("date", ""),
            })

        return {
            "deals": deals,
            "buy_deals": [d for d in deals if d.get("deal_type") == "BUY"],
            "sell_deals": [d for d in deals if d.get("deal_type") == "SELL"],
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_corporate_actions(self) -> Dict[str, Any]:
        """Fetch upcoming corporate actions (dividends, splits, bonus, rights)."""
        data = await self.nse.get_corporate_actions()
        if not data:
            return {"actions": [], "timestamp": datetime.now().isoformat()}

        actions = []
        raw_actions = data if isinstance(data, list) else data.get("data", [])
        for item in raw_actions:
            actions.append({
                "symbol": item.get("symbol", ""),
                "company": item.get("comp", "") or item.get("company", ""),
                "subject": item.get("subject", ""),
                "ex_date": item.get("exDate", ""),
                "record_date": item.get("recDate", ""),
                "bc_start": item.get("bcStartDate", ""),
                "bc_end": item.get("bcEndDate", ""),
                "series": item.get("series", ""),
            })

        return {
            "actions": actions,
            "dividends": [a for a in actions if "dividend" in a.get("subject", "").lower()],
            "splits": [a for a in actions if "split" in a.get("subject", "").lower()],
            "bonus": [a for a in actions if "bonus" in a.get("subject", "").lower()],
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_market_status(self) -> Dict[str, Any]:
        """Get current market status (open/closed/pre-open)."""
        data = await self.nse.get_market_status()
        if not data:
            return {"status": "unknown"}

        statuses = []
        for item in data.get("marketState", []):
            statuses.append({
                "market": item.get("market", ""),
                "market_status": item.get("marketStatus", ""),
                "trade_date": item.get("tradeDate", ""),
                "index": item.get("index", ""),
                "last": item.get("last", 0),
                "variation": item.get("variation", 0),
                "pct_change": item.get("percentChange", 0),
                "market_status_message": item.get("marketStatusMessage", ""),
            })

        return {
            "statuses": statuses,
            "is_market_open": any(
                s.get("market_status") in ["Open", "Live"] for s in statuses
            ),
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_market_turnover(self) -> Dict[str, Any]:
        """Get market-wide turnover data."""
        data = await self.nse.get_endpoint("market_turnover")
        if not data:
            return {"turnover": {}, "timestamp": datetime.now().isoformat()}
        return {
            "turnover": data,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_nifty50_snapshot(self) -> Dict[str, Any]:
        """
        Quick snapshot of all Nifty 50 stocks.
        Used for heatmap and overview displays.
        """
        return await self.collect_index_stocks("NIFTY 50")

    async def collect_banknifty_snapshot(self) -> Dict[str, Any]:
        """Quick snapshot of Bank Nifty stocks."""
        return await self.collect_index_stocks("NIFTY BANK")

    async def collect_sectoral_performance(self) -> Dict[str, Any]:
        """Collect performance data for all sectoral indices."""
        data = await self.nse.get_all_indices()
        if not data or "data" not in data:
            return {"sectors": [], "timestamp": datetime.now().isoformat()}

        sectors = []
        sectoral_names = {
            "NIFTY BANK", "NIFTY IT", "NIFTY AUTO", "NIFTY PHARMA",
            "NIFTY FMCG", "NIFTY METAL", "NIFTY REALTY", "NIFTY ENERGY",
            "NIFTY INFRA", "NIFTY PSE", "NIFTY MEDIA", "NIFTY PRIVATE BANK",
            "NIFTY PSU BANK", "NIFTY FINANCIAL SERVICES",
        }

        for item in data["data"]:
            name = item.get("index", "")
            if name in sectoral_names:
                sectors.append({
                    "name": name,
                    "last": item.get("last", 0),
                    "change": item.get("variation", 0),
                    "pct_change": item.get("percentChange", 0),
                    "advances": item.get("advances", 0),
                    "declines": item.get("declines", 0),
                })

        sectors.sort(key=lambda x: x.get("pct_change", 0), reverse=True)

        return {
            "sectors": sectors,
            "top_sector": sectors[0] if sectors else None,
            "bottom_sector": sectors[-1] if sectors else None,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_delivery_data(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch delivery percentage data for a stock.
        High delivery = strong conviction (institutional buying/selling).
        """
        data = await self.nse.get_endpoint("equity_trade_info", symbol=symbol.upper())
        if not data:
            return {"symbol": symbol, "error": "No data"}

        trade_info = data.get("securityWiseDP", {})
        return {
            "symbol": symbol,
            "quantity_traded": trade_info.get("quantityTraded", 0),
            "delivery_quantity": trade_info.get("deliveryQuantity", 0),
            "delivery_to_traded_pct": trade_info.get("deliveryToTradedQuantity", 0),
            "series_remarks": trade_info.get("seriesRemarks", ""),
            "timestamp": datetime.now().isoformat(),
        }
