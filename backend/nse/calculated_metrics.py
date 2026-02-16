"""
Calculated Metrics Engine
Greeks, PCR, Max Pain, Volume Profile, IV Percentile, Straddle pricing.
Enhances raw NSE data with computed analytics.
"""

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.stats import norm

logger = logging.getLogger(__name__)


class CalculatedMetrics:
    """
    Computes derived analytics from raw market data.

    Metrics:
    - Options Greeks (Black-Scholes)
    - Put-Call Ratio (OI and Volume based)
    - Max Pain analysis
    - Volume Profile (POC, VAH, VAL)
    - IV Percentile and Rank
    - Straddle/Strangle pricing
    - Support/Resistance from OI
    - Expected Move calculation
    """

    RISK_FREE_RATE = 0.065  # India 10Y govt bond yield (~6.5%)
    TRADING_DAYS = 252

    def compute_greeks(
        self,
        spot: float,
        strike: float,
        expiry_days: float,
        iv: float,
        option_type: str = "CE",
        risk_free_rate: float = None,
    ) -> Dict[str, float]:
        """
        Black-Scholes Greeks for a single option.

        Args:
            spot: Current underlying price
            strike: Option strike price
            expiry_days: Days to expiry
            iv: Implied volatility (percentage, e.g., 15 for 15%)
            option_type: "CE" for call, "PE" for put
            risk_free_rate: Override risk-free rate
        """
        r = risk_free_rate or self.RISK_FREE_RATE
        t = max(expiry_days / 365.0, 1 / (365 * 24))  # Min 1 hour
        sigma = iv / 100.0 if iv > 1 else iv

        if sigma <= 0 or spot <= 0 or strike <= 0:
            return {"delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0, "price": 0}

        try:
            sqrt_t = math.sqrt(t)
            d1 = (math.log(spot / strike) + (r + sigma**2 / 2) * t) / (sigma * sqrt_t)
            d2 = d1 - sigma * sqrt_t

            nd1 = norm.cdf(d1)
            nd2 = norm.cdf(d2)
            npd1 = norm.pdf(d1)
            discount = math.exp(-r * t)

            is_call = option_type.upper() in ("CE", "CALL", "C")

            if is_call:
                delta = nd1
                price = spot * nd1 - strike * discount * nd2
                theta = -(spot * npd1 * sigma / (2 * sqrt_t)) - r * strike * discount * nd2
                rho = strike * t * discount * nd2
            else:
                delta = nd1 - 1
                price = strike * discount * norm.cdf(-d2) - spot * norm.cdf(-d1)
                theta = -(spot * npd1 * sigma / (2 * sqrt_t)) + r * strike * discount * norm.cdf(-d2)
                rho = -strike * t * discount * norm.cdf(-d2)

            gamma = npd1 / (spot * sigma * sqrt_t)
            vega = spot * sqrt_t * npd1

            return {
                "delta": round(delta, 4),
                "gamma": round(gamma, 6),
                "theta": round(theta / 365, 4),  # Per day
                "vega": round(vega / 100, 4),     # Per 1% IV change
                "rho": round(rho / 100, 4),
                "price": round(max(0, price), 2),
                "iv_used": round(sigma * 100, 2),
            }
        except (ValueError, ZeroDivisionError) as e:
            return {"delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0, "price": 0, "error": str(e)}

    def compute_chain_greeks(self, chain_data: Dict) -> List[Dict]:
        """Compute Greeks for every option in an options chain."""
        spot = chain_data.get("spot_price", 0)
        chain = chain_data.get("chain", [])
        results = []

        for entry in chain:
            strike = entry.get("strike", 0)
            expiry_str = entry.get("expiry", "")
            expiry_days = self._days_to_expiry(expiry_str)

            for side in ["ce", "pe"]:
                opt_data = entry.get(side)
                if not opt_data:
                    continue

                iv = opt_data.get("iv", 15)
                greeks = self.compute_greeks(
                    spot=spot, strike=strike,
                    expiry_days=expiry_days, iv=iv,
                    option_type="CE" if side == "ce" else "PE",
                )

                results.append({
                    "strike": strike,
                    "type": side.upper(),
                    "ltp": opt_data.get("ltp", 0),
                    "oi": opt_data.get("oi", 0),
                    "volume": opt_data.get("volume", 0),
                    "iv": iv,
                    **greeks,
                })

        return results

    def compute_volume_profile(
        self, prices: List[float], volumes: List[float], num_bins: int = 20
    ) -> Dict[str, Any]:
        """
        Volume Profile analysis.

        Returns:
        - POC (Point of Control): Price level with highest volume
        - VAH (Value Area High): Upper 70% volume boundary
        - VAL (Value Area Low): Lower 70% volume boundary
        - HVN (High Volume Nodes)
        - LVN (Low Volume Nodes)
        """
        if not prices or not volumes or len(prices) != len(volumes):
            return {"error": "Invalid data"}

        prices_arr = np.array(prices, dtype=float)
        volumes_arr = np.array(volumes, dtype=float)

        # Create price bins
        price_min, price_max = prices_arr.min(), prices_arr.max()
        bins = np.linspace(price_min, price_max, num_bins + 1)
        bin_centers = (bins[:-1] + bins[1:]) / 2

        # Assign volumes to bins
        vol_profile = np.zeros(num_bins)
        for i, (p, v) in enumerate(zip(prices_arr, volumes_arr)):
            bin_idx = min(np.searchsorted(bins, p) - 1, num_bins - 1)
            bin_idx = max(0, bin_idx)
            vol_profile[bin_idx] += v

        total_vol = vol_profile.sum()
        if total_vol == 0:
            return {"error": "No volume data"}

        # POC
        poc_idx = np.argmax(vol_profile)
        poc = float(bin_centers[poc_idx])

        # Value Area (70% of volume around POC)
        sorted_indices = np.argsort(vol_profile)[::-1]
        cumulative = 0
        value_area_indices = []
        for idx in sorted_indices:
            cumulative += vol_profile[idx]
            value_area_indices.append(idx)
            if cumulative >= total_vol * 0.7:
                break

        va_prices = [bin_centers[i] for i in value_area_indices]
        vah = max(va_prices) if va_prices else poc
        val_ = min(va_prices) if va_prices else poc

        # HVN and LVN
        avg_vol = total_vol / num_bins
        hvn = [{"price": float(bin_centers[i]), "volume": float(vol_profile[i])}
               for i in range(num_bins) if vol_profile[i] > avg_vol * 1.5]
        lvn = [{"price": float(bin_centers[i]), "volume": float(vol_profile[i])}
               for i in range(num_bins) if 0 < vol_profile[i] < avg_vol * 0.5]

        # VWAP
        vwap = float(np.sum(prices_arr * volumes_arr) / total_vol) if total_vol > 0 else 0

        return {
            "poc": round(poc, 2),
            "vah": round(float(vah), 2),
            "val": round(float(val_), 2),
            "vwap": round(vwap, 2),
            "hvn": hvn[:5],
            "lvn": lvn[:5],
            "profile": [
                {"price": round(float(bin_centers[i]), 2), "volume": round(float(vol_profile[i]), 0)}
                for i in range(num_bins)
            ],
        }

    def compute_expected_move(self, spot: float, iv: float, days: float) -> Dict[str, float]:
        """
        Calculate expected move based on IV.
        Expected Move = Spot * IV * sqrt(DTE/365)
        """
        sigma = iv / 100.0 if iv > 1 else iv
        t = days / 365.0
        move = spot * sigma * math.sqrt(t)

        return {
            "expected_move": round(move, 2),
            "upper_range": round(spot + move, 2),
            "lower_range": round(spot - move, 2),
            "move_pct": round((move / spot) * 100, 2),
            "one_sd_prob": 68.27,
            "two_sd_upper": round(spot + 2 * move, 2),
            "two_sd_lower": round(spot - 2 * move, 2),
        }

    def compute_oi_based_support_resistance(self, chain_data: Dict) -> Dict[str, Any]:
        """
        Find support/resistance from options OI data.
        - Highest Put OI = Support (put writers don't want price below)
        - Highest Call OI = Resistance (call writers don't want price above)
        """
        chain = chain_data.get("chain", [])
        spot = chain_data.get("spot_price", 0)

        if not chain:
            return {"support": 0, "resistance": 0}

        max_pe_oi = 0
        max_ce_oi = 0
        support_strike = 0
        resistance_strike = 0

        for entry in chain:
            strike = entry.get("strike", 0)
            pe_oi = entry.get("pe", {}).get("oi", 0) if entry.get("pe") else 0
            ce_oi = entry.get("ce", {}).get("oi", 0) if entry.get("ce") else 0

            if pe_oi > max_pe_oi and strike <= spot:
                max_pe_oi = pe_oi
                support_strike = strike

            if ce_oi > max_ce_oi and strike >= spot:
                max_ce_oi = ce_oi
                resistance_strike = strike

        return {
            "support": support_strike,
            "support_oi": max_pe_oi,
            "resistance": resistance_strike,
            "resistance_oi": max_ce_oi,
            "spot": spot,
            "range": resistance_strike - support_strike if (resistance_strike and support_strike) else 0,
        }

    def compute_straddle_price(self, chain_data: Dict) -> Dict[str, Any]:
        """
        Calculate ATM straddle price for expected move indication.
        Straddle = ATM CE + ATM PE premium.
        """
        spot = chain_data.get("spot_price", 0)
        atm = chain_data.get("atm_strike", 0)
        chain = chain_data.get("chain", [])

        for entry in chain:
            if entry.get("strike") == atm:
                ce_ltp = entry.get("ce", {}).get("ltp", 0) if entry.get("ce") else 0
                pe_ltp = entry.get("pe", {}).get("ltp", 0) if entry.get("pe") else 0
                straddle = ce_ltp + pe_ltp

                return {
                    "atm_strike": atm,
                    "ce_premium": ce_ltp,
                    "pe_premium": pe_ltp,
                    "straddle_price": round(straddle, 2),
                    "breakeven_upper": round(atm + straddle, 2),
                    "breakeven_lower": round(atm - straddle, 2),
                    "implied_range_pct": round((straddle / spot) * 100, 2) if spot else 0,
                }

        return {"error": "ATM strike not found"}

    def _days_to_expiry(self, expiry_str: str) -> float:
        """Parse expiry string to days remaining."""
        if not expiry_str:
            return 7.0

        for fmt in ("%d-%b-%Y", "%Y-%m-%d", "%d-%m-%Y", "%d %b %Y"):
            try:
                expiry = datetime.strptime(expiry_str, fmt)
                delta = expiry - datetime.now()
                return max(delta.total_seconds() / 86400, 0.04)  # Min 1 hour
            except ValueError:
                continue

        return 7.0
