"""
NSE Derivatives Data Collector
Collects options chain, F&O quotes, participant-wise OI, and FII/DII flows.
This is the most critical data source for options trading.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class DerivativesCollector:
    """
    Collects all derivatives-related data from NSE.

    Data collected:
    - Complete options chain (every strike, CE + PE)
    - OI, Volume, IV, LTP for each strike
    - FII/DII institutional flows (cash + F&O)
    - Participant-wise OI (FII/DII/Pro/Client)
    - F&O ban list
    """

    # F&O enabled indices
    FO_INDICES = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"]

    # Popular F&O stocks
    POPULAR_FO_STOCKS = [
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
        "SBIN", "BHARTIARTL", "KOTAKBANK", "LT", "AXISBANK",
        "BAJFINANCE", "TATAMOTORS", "MARUTI", "WIPRO", "HCLTECH",
        "TATASTEEL", "JSWSTEEL", "HINDALCO", "SUNPHARMA", "DRREDDY",
    ]

    def __init__(self, nse_client):
        self.nse = nse_client

    async def collect_options_chain(self, symbol: str = "NIFTY", is_index: bool = True) -> Dict[str, Any]:
        """
        Fetch complete options chain for a symbol.
        This is THE most important data for options trading.

        Returns:
        - All strikes with CE and PE data
        - OI, volume, IV for each
        - Spot price, expiry dates
        - PCR calculation
        - Max pain calculation
        """
        data = await self.nse.get_option_chain(symbol.upper(), is_index=is_index)
        if not data:
            return {"symbol": symbol, "error": "No data", "records": []}

        records = data.get("records", {})
        filtered = data.get("filtered", {})

        # Get spot price and expiry dates
        underlying_value = records.get("underlyingValue", 0)
        expiry_dates = records.get("expiryDates", [])
        strikePrices = records.get("strikePrices", [])
        current_expiry = expiry_dates[0] if expiry_dates else ""

        # Parse options chain data
        chain = []
        total_ce_oi = 0
        total_pe_oi = 0
        total_ce_volume = 0
        total_pe_volume = 0

        for row in records.get("data", []):
            strike = row.get("strikePrice", 0)
            expiry = row.get("expiryDate", "")

            ce = row.get("CE", {})
            pe = row.get("PE", {})

            entry = {
                "strike": strike,
                "expiry": expiry,
                "ce": {
                    "oi": ce.get("openInterest", 0),
                    "change_oi": ce.get("changeinOpenInterest", 0),
                    "volume": ce.get("totalTradedVolume", 0),
                    "iv": ce.get("impliedVolatility", 0),
                    "ltp": ce.get("lastPrice", 0),
                    "change": ce.get("change", 0),
                    "pct_change": ce.get("pChange", 0),
                    "bid_qty": ce.get("bidQty", 0),
                    "bid_price": ce.get("bidprice", 0),
                    "ask_price": ce.get("askPrice", 0),
                    "ask_qty": ce.get("askQty", 0),
                    "underlying": ce.get("underlyingValue", underlying_value),
                } if ce else None,
                "pe": {
                    "oi": pe.get("openInterest", 0),
                    "change_oi": pe.get("changeinOpenInterest", 0),
                    "volume": pe.get("totalTradedVolume", 0),
                    "iv": pe.get("impliedVolatility", 0),
                    "ltp": pe.get("lastPrice", 0),
                    "change": pe.get("change", 0),
                    "pct_change": pe.get("pChange", 0),
                    "bid_qty": pe.get("bidQty", 0),
                    "bid_price": pe.get("bidprice", 0),
                    "ask_price": pe.get("askPrice", 0),
                    "ask_qty": pe.get("askQty", 0),
                    "underlying": pe.get("underlyingValue", underlying_value),
                } if pe else None,
            }

            chain.append(entry)

            # Accumulate totals
            if ce:
                total_ce_oi += ce.get("openInterest", 0)
                total_ce_volume += ce.get("totalTradedVolume", 0)
            if pe:
                total_pe_oi += pe.get("openInterest", 0)
                total_pe_volume += pe.get("totalTradedVolume", 0)

        # Calculate PCR
        pcr_oi = round(total_pe_oi / total_ce_oi, 3) if total_ce_oi > 0 else 0
        pcr_volume = round(total_pe_volume / total_ce_volume, 3) if total_ce_volume > 0 else 0

        # Calculate Max Pain
        max_pain = self._calculate_max_pain(chain)

        # Find ATM strike
        atm_strike = min(strikePrices, key=lambda x: abs(x - underlying_value)) if strikePrices else 0

        # Calculate straddle premium at ATM
        straddle_premium = 0
        for entry in chain:
            if entry["strike"] == atm_strike and entry.get("ce") and entry.get("pe"):
                straddle_premium = (entry["ce"]["ltp"] or 0) + (entry["pe"]["ltp"] or 0)
                break

        # Filtered data (current expiry totals from NSE)
        filtered_ce_oi = filtered.get("CE", {}).get("totOI", total_ce_oi)
        filtered_pe_oi = filtered.get("PE", {}).get("totOI", total_pe_oi)
        filtered_ce_vol = filtered.get("CE", {}).get("totVol", total_ce_volume)
        filtered_pe_vol = filtered.get("PE", {}).get("totVol", total_pe_volume)

        return {
            "symbol": symbol,
            "spot_price": underlying_value,
            "atm_strike": atm_strike,
            "expiry_dates": expiry_dates,
            "current_expiry": current_expiry,
            "chain": chain,
            "totals": {
                "ce_oi": filtered_ce_oi,
                "pe_oi": filtered_pe_oi,
                "ce_volume": filtered_ce_vol,
                "pe_volume": filtered_pe_vol,
            },
            "pcr": {
                "oi": pcr_oi,
                "volume": pcr_volume,
                "signal": "bearish" if pcr_oi > 1.2 else ("bullish" if pcr_oi < 0.7 else "neutral"),
            },
            "max_pain": max_pain,
            "straddle_premium": round(straddle_premium, 2),
            "iv_data": self._extract_iv_data(chain, atm_strike),
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_all_index_chains(self) -> Dict[str, Any]:
        """Fetch options chains for all F&O indices in parallel."""
        tasks = [
            self.collect_options_chain(idx, is_index=True)
            for idx in self.FO_INDICES
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        chains = {}
        for idx, result in zip(self.FO_INDICES, results):
            if isinstance(result, Exception):
                logger.error(f"Options chain error for {idx}: {result}")
                chains[idx] = {"error": str(result)}
            else:
                chains[idx] = result

        return {
            "chains": chains,
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_fii_dii(self) -> Dict[str, Any]:
        """
        Fetch FII/DII trading activity.
        Shows institutional buying/selling in cash and F&O segments.
        """
        data = await self.nse.get_fii_dii()
        if not data:
            return {"fii_dii": [], "timestamp": datetime.now().isoformat()}

        entries = []
        for item in data if isinstance(data, list) else data.get("data", []):
            entries.append({
                "category": item.get("category", ""),
                "date": item.get("date", ""),
                "buy_value": item.get("buyValue", 0),
                "sell_value": item.get("sellValue", 0),
                "net_value": item.get("netValue", 0),
            })

        # Summarize
        fii = [e for e in entries if "FII" in e.get("category", "").upper() or "FPI" in e.get("category", "").upper()]
        dii = [e for e in entries if "DII" in e.get("category", "").upper()]

        fii_net = sum(e.get("net_value", 0) for e in fii)
        dii_net = sum(e.get("net_value", 0) for e in dii)

        return {
            "entries": entries,
            "fii_net": fii_net,
            "dii_net": dii_net,
            "fii_signal": "bullish" if fii_net > 0 else "bearish",
            "dii_signal": "bullish" if dii_net > 0 else "bearish",
            "institutional_bias": "bullish" if (fii_net + dii_net) > 0 else "bearish",
            "timestamp": datetime.now().isoformat(),
        }

    async def collect_stock_option_chain(self, symbol: str) -> Dict[str, Any]:
        """Fetch options chain for individual F&O stock."""
        return await self.collect_options_chain(symbol, is_index=False)

    def _calculate_max_pain(self, chain: List[Dict]) -> Dict[str, Any]:
        """
        Calculate max pain strike from options chain.
        Max pain = strike where option writers' loss is minimized.
        """
        strikes_data = {}
        for entry in chain:
            strike = entry["strike"]
            ce_oi = entry.get("ce", {}).get("oi", 0) if entry.get("ce") else 0
            pe_oi = entry.get("pe", {}).get("oi", 0) if entry.get("pe") else 0
            strikes_data[strike] = {"ce_oi": ce_oi, "pe_oi": pe_oi}

        if not strikes_data:
            return {"strike": 0, "value": 0}

        strikes = sorted(strikes_data.keys())
        min_pain = float("inf")
        max_pain_strike = 0

        for test_strike in strikes:
            total_pain = 0
            for strike, data in strikes_data.items():
                if strike < test_strike:
                    total_pain += (test_strike - strike) * data["ce_oi"]
                elif strike > test_strike:
                    total_pain += (strike - test_strike) * data["pe_oi"]

            if total_pain < min_pain:
                min_pain = total_pain
                max_pain_strike = test_strike

        return {
            "strike": max_pain_strike,
            "value": min_pain,
        }

    def _extract_iv_data(self, chain: List[Dict], atm_strike: float) -> Dict[str, Any]:
        """Extract IV data for analysis (ATM IV, skew, term structure)."""
        atm_iv_ce = 0
        atm_iv_pe = 0
        otm_put_ivs = []
        otm_call_ivs = []

        for entry in chain:
            strike = entry["strike"]
            ce_iv = entry.get("ce", {}).get("iv", 0) if entry.get("ce") else 0
            pe_iv = entry.get("pe", {}).get("iv", 0) if entry.get("pe") else 0

            if strike == atm_strike:
                atm_iv_ce = ce_iv
                atm_iv_pe = pe_iv
            elif strike < atm_strike and pe_iv > 0:
                otm_put_ivs.append(pe_iv)
            elif strike > atm_strike and ce_iv > 0:
                otm_call_ivs.append(ce_iv)

        avg_otm_put_iv = sum(otm_put_ivs) / len(otm_put_ivs) if otm_put_ivs else 0
        avg_otm_call_iv = sum(otm_call_ivs) / len(otm_call_ivs) if otm_call_ivs else 0

        return {
            "atm_iv_ce": atm_iv_ce,
            "atm_iv_pe": atm_iv_pe,
            "atm_iv_avg": round((atm_iv_ce + atm_iv_pe) / 2, 2) if (atm_iv_ce and atm_iv_pe) else 0,
            "otm_put_iv_avg": round(avg_otm_put_iv, 2),
            "otm_call_iv_avg": round(avg_otm_call_iv, 2),
            "iv_skew": round(avg_otm_put_iv - avg_otm_call_iv, 2),
            "skew_signal": "fear" if (avg_otm_put_iv - avg_otm_call_iv) > 3 else "normal",
        }
