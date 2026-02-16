"""
Risk Metrics Agent (Enhanced)
Computes Alpha, Beta, and full Options Greeks (Delta, Gamma, Theta, Vega, Rho)
using Black-Scholes model. Integrates with VIX and sentiment for holistic risk scoring.
"""

import logging
import math
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.stats import norm

logger = logging.getLogger(__name__)


class RiskMetricsAgent:
    """
    Computes portfolio risk metrics and full Options Greeks.
    Black-Scholes model for European options (approximation for NSE).
    """

    RISK_FREE_RATE = 0.05  # 5% (India govt bond yield)

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client

    async def run(self, shared_state) -> Dict[str, Any]:
        """Compute all risk metrics and Greeks for the current cycle."""
        start = time.time()

        ltp = shared_state.get("ltp", {})
        vix = shared_state.get("vix", 15.0)
        options_chain = shared_state.get("options_chain", [])
        historical = shared_state.get("historical", {})
        sentiment = shared_state.get("sentiment", {})

        # 1. Compute Alpha and Beta
        alpha_beta = self._compute_alpha_beta(historical)

        # 2. Compute Greeks for each option in chain
        greeks_data = self._compute_all_greeks(options_chain, ltp, vix)

        # 3. Portfolio-level aggregate Greeks
        portfolio_greeks = self._aggregate_greeks(greeks_data)

        # 4. Risk Score Integration
        risk_score = self._compute_risk_score(
            alpha_beta=alpha_beta,
            portfolio_greeks=portfolio_greeks,
            vix=vix,
            sentiment=sentiment,
        )

        result = {
            "alpha": alpha_beta.get("alpha", 0),
            "beta": alpha_beta.get("beta", 1.0),
            "alpha_beta_detail": alpha_beta,
            "greeks_per_option": greeks_data,
            "portfolio_greeks": portfolio_greeks,
            "risk_score": risk_score["score"],
            "risk_label": risk_score["label"],
            "risk_factors": risk_score["factors"],
            "vix": vix,
            "timestamp": datetime.now().isoformat(),
            "duration_ms": (time.time() - start) * 1000,
        }

        # AI interpretation
        if self.ollama and self.ollama.is_available:
            interpretation = self._interpret_risk(result)
            result["ai_interpretation"] = interpretation

        shared_state.set("risk_metrics", result)
        return result

    # ==================== Alpha / Beta ====================

    def _compute_alpha_beta(self, historical: Dict) -> Dict[str, Any]:
        """
        Alpha: α = Rp - [Rf + β(Rm - Rf)]
        Beta: Cov(Rp, Rm) / Var(Rm)
        Uses Sensex as market proxy, rolling 1-hour window.
        """
        market_data = historical.get("sensex", {})
        portfolio_data = historical.get("nifty50", {})  # Using Nifty as portfolio proxy

        if not market_data.get("close") or not portfolio_data.get("close"):
            return {"alpha": 0.0, "beta": 1.0, "note": "Insufficient data"}

        try:
            market_closes = np.array(market_data["close"], dtype=float)
            portfolio_closes = np.array(portfolio_data["close"], dtype=float)

            # Align lengths
            min_len = min(len(market_closes), len(portfolio_closes))
            market_closes = market_closes[-min_len:]
            portfolio_closes = portfolio_closes[-min_len:]

            # Compute returns
            market_returns = np.diff(market_closes) / market_closes[:-1]
            portfolio_returns = np.diff(portfolio_closes) / portfolio_closes[:-1]

            if len(market_returns) < 2:
                return {"alpha": 0.0, "beta": 1.0, "note": "Too few data points"}

            # Use last ~12 data points (~1 hour of 5-min candles)
            window = min(12, len(market_returns))
            mr = market_returns[-window:]
            pr = portfolio_returns[-window:]

            # Beta = Cov(Rp, Rm) / Var(Rm)
            covariance = np.cov(pr, mr)[0][1]
            market_var = np.var(mr)
            beta = float(covariance / market_var) if market_var > 0 else 1.0

            # Alpha = Rp - [Rf + β(Rm - Rf)]
            rf_period = self.RISK_FREE_RATE / (252 * 78)  # Per 5-min period
            rp = float(np.mean(pr))
            rm = float(np.mean(mr))
            alpha = rp - (rf_period + beta * (rm - rf_period))

            return {
                "alpha": round(alpha * 100, 4),  # Percentage
                "beta": round(beta, 4),
                "market_return": round(rm * 100, 4),
                "portfolio_return": round(rp * 100, 4),
                "window_periods": window,
            }

        except Exception as e:
            logger.error(f"Alpha/Beta computation failed: {e}")
            return {"alpha": 0.0, "beta": 1.0, "error": str(e)}

    # ==================== Black-Scholes Greeks ====================

    def _compute_all_greeks(
        self, options_chain: List[Dict], ltp: Dict, vix: float
    ) -> List[Dict]:
        """Compute full Greeks for every option in the chain."""
        greeks_list = []

        for option in options_chain:
            index = option.get("index", "nifty50")
            spot = ltp.get(index, 25000)
            strike = option.get("strike", spot)
            opt_type = option.get("type", "CE").upper()
            iv = option.get("iv", vix)
            expiry_str = option.get("expiry", "")

            # Time to expiry in years
            t = self._time_to_expiry(expiry_str)
            if t <= 0:
                t = 1 / (365 * 24)  # Minimum: 1 hour

            # Implied volatility (decimal)
            sigma = iv / 100.0 if iv > 1 else iv
            if sigma <= 0:
                sigma = vix / 100.0

            # Compute Greeks
            greeks = self._black_scholes_greeks(
                S=spot,
                K=strike,
                t=t,
                r=self.RISK_FREE_RATE,
                sigma=sigma,
                option_type="call" if opt_type == "CE" else "put",
            )

            greeks_list.append({
                "index": index,
                "strike": strike,
                "type": opt_type,
                "ltp": option.get("ltp", 0),
                "oi": option.get("oi", 0),
                "volume": option.get("volume", 0),
                **greeks,
            })

        return greeks_list

    def _black_scholes_greeks(
        self,
        S: float,
        K: float,
        t: float,
        r: float,
        sigma: float,
        option_type: str = "call",
    ) -> Dict[str, float]:
        """
        Full Black-Scholes Greeks calculation.

        Parameters:
            S     - Spot price (LTP)
            K     - Strike price
            t     - Time to expiry (years)
            r     - Risk-free rate (decimal)
            sigma - Implied volatility (decimal)
            option_type - 'call' or 'put'

        Returns:
            Dict with delta, gamma, theta, vega, rho, theoretical_price
        """
        try:
            sqrt_t = math.sqrt(t)

            # d1 and d2
            d1 = (math.log(S / K) + (r + sigma**2 / 2) * t) / (sigma * sqrt_t)
            d2 = d1 - sigma * sqrt_t

            # Standard normal CDF and PDF
            n_d1 = norm.cdf(d1)
            n_d2 = norm.cdf(d2)
            n_neg_d1 = norm.cdf(-d1)
            n_neg_d2 = norm.cdf(-d2)
            nprime_d1 = norm.pdf(d1)  # N'(d1)

            # Discount factor
            discount = math.exp(-r * t)

            if option_type == "call":
                # === CALL OPTIONS ===

                # Delta: N(d1)
                delta = n_d1

                # Theoretical Price: S*N(d1) - K*e^(-rt)*N(d2)
                price = S * n_d1 - K * discount * n_d2

                # Theta: -[S*N'(d1)*σ / (2√t)] - r*K*e^(-rt)*N(d2)
                theta = -(S * nprime_d1 * sigma / (2 * sqrt_t)) - r * K * discount * n_d2

                # Rho: K*t*e^(-rt)*N(d2)
                rho = K * t * discount * n_d2

            else:
                # === PUT OPTIONS ===

                # Delta: N(d1) - 1
                delta = n_d1 - 1

                # Theoretical Price: K*e^(-rt)*N(-d2) - S*N(-d1)
                price = K * discount * n_neg_d2 - S * n_neg_d1

                # Theta: -[S*N'(d1)*σ / (2√t)] + r*K*e^(-rt)*N(-d2)
                theta = -(S * nprime_d1 * sigma / (2 * sqrt_t)) + r * K * discount * n_neg_d2

                # Rho: -K*t*e^(-rt)*N(-d2)
                rho = -K * t * discount * n_neg_d2

            # === Common Greeks (same for calls and puts) ===

            # Gamma: N'(d1) / (S * σ * √t)
            gamma = nprime_d1 / (S * sigma * sqrt_t)

            # Vega: S * √t * N'(d1)
            vega = S * sqrt_t * nprime_d1

            # Normalize theta to per-day and vega to per 1% vol change
            theta_daily = theta / 365
            vega_pct = vega / 100

            return {
                "delta": round(delta, 4),
                "gamma": round(gamma, 6),
                "theta": round(theta_daily, 4),
                "vega": round(vega_pct, 4),
                "rho": round(rho / 100, 4),
                "theoretical_price": round(price, 2),
                "d1": round(d1, 4),
                "d2": round(d2, 4),
                "iv_used": round(sigma * 100, 2),
            }

        except (ValueError, ZeroDivisionError) as e:
            logger.warning(f"Greeks calc error (S={S}, K={K}, t={t}, σ={sigma}): {e}")
            return {
                "delta": 0, "gamma": 0, "theta": 0,
                "vega": 0, "rho": 0, "theoretical_price": 0,
                "error": str(e),
            }

    def _aggregate_greeks(self, greeks_list: List[Dict]) -> Dict[str, float]:
        """Aggregate portfolio-level Greeks (sum across positions)."""
        if not greeks_list:
            return {"delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0}

        agg = {"delta": 0, "gamma": 0, "theta": 0, "vega": 0, "rho": 0}
        for g in greeks_list:
            for key in agg:
                agg[key] += g.get(key, 0)

        return {k: round(v, 4) for k, v in agg.items()}

    # ==================== Risk Score ====================

    def _compute_risk_score(
        self,
        alpha_beta: Dict,
        portfolio_greeks: Dict,
        vix: float,
        sentiment: Dict,
    ) -> Dict[str, Any]:
        """
        Integrated risk score combining all metrics.
        Score: 0-100 (higher = more risk). Labels: low/medium/high.
        """
        factors = []
        score = 0

        # Beta factor (>1.2 = high risk)
        beta = alpha_beta.get("beta", 1.0)
        if beta > 1.5:
            score += 25
            factors.append(f"High beta ({beta:.2f}) — portfolio very sensitive to market")
        elif beta > 1.2:
            score += 15
            factors.append(f"Elevated beta ({beta:.2f}) — above-average market sensitivity")
        elif beta < 0.8:
            score += 5
            factors.append(f"Low beta ({beta:.2f}) — defensive positioning")

        # VIX factor (>20 = high risk)
        if vix > 25:
            score += 25
            factors.append(f"Very high VIX ({vix:.1f}) — extreme volatility environment")
        elif vix > 20:
            score += 15
            factors.append(f"Elevated VIX ({vix:.1f}) — above-normal volatility")
        elif vix < 12:
            score += 5
            factors.append(f"Low VIX ({vix:.1f}) — complacency risk")

        # Gamma factor (>0.05 = convexity risk)
        gamma = abs(portfolio_greeks.get("gamma", 0))
        if gamma > 0.1:
            score += 20
            factors.append(f"High portfolio gamma ({gamma:.4f}) — significant convexity risk")
        elif gamma > 0.05:
            score += 10
            factors.append(f"Moderate gamma ({gamma:.4f}) — watch for rapid delta changes")

        # Sentiment factor (negative = increase caution)
        sent_score = sentiment.get("sentiment_score", 0) if isinstance(sentiment, dict) else 0
        if sent_score < -0.5:
            score += 15
            factors.append(f"Very negative sentiment ({sent_score:.2f}) — bearish pressure")
        elif sent_score < -0.2:
            score += 10
            factors.append(f"Negative sentiment ({sent_score:.2f}) — cautious environment")

        # Theta factor (large negative = time decay risk)
        theta = portfolio_greeks.get("theta", 0)
        if theta < -50:
            score += 10
            factors.append(f"High theta decay (₹{theta:.0f}/day) — time working against positions")

        # Cap at 100
        score = min(100, score)

        # Label
        if score >= 60:
            label = "high"
        elif score >= 30:
            label = "medium"
        else:
            label = "low"

        return {
            "score": score,
            "label": label,
            "factors": factors,
        }

    # ==================== Helpers ====================

    @staticmethod
    def _time_to_expiry(expiry_str: str) -> float:
        """Convert expiry date string to time in years."""
        if not expiry_str:
            return 7 / 365  # Default: 1 week

        try:
            expiry = datetime.strptime(expiry_str, "%Y-%m-%d")
            now = datetime.now()
            delta = expiry - now
            days = max(delta.total_seconds() / 86400, 0.01)
            return days / 365
        except (ValueError, TypeError):
            return 7 / 365

    def _interpret_risk(self, metrics: Dict) -> Dict:
        """Use Llama3.1 for qualitative risk interpretation."""
        prompt = self.ollama.build_agent_prompt(
            agent_name="Risk Analyst",
            steps=[
                f"Review risk score: {metrics['risk_label']} ({metrics['risk_score']}/100)",
                f"Analyze alpha ({metrics['alpha']}) and beta ({metrics['beta']})",
                "Review portfolio Greeks for concentration risks",
                "If VIX is high and gamma is positive, warn of convexity risk explicitly",
                "Provide 2-3 actionable risk management suggestions",
            ],
            data={
                "risk_score": metrics["risk_score"],
                "risk_label": metrics["risk_label"],
                "alpha": metrics["alpha"],
                "beta": metrics["beta"],
                "portfolio_greeks": metrics["portfolio_greeks"],
                "vix": metrics["vix"],
                "risk_factors": metrics["risk_factors"],
            },
            output_fields=["assessment", "warnings", "suggestions", "hedge_recommendation"],
        )
        return self.ollama.chat_json(prompt)
