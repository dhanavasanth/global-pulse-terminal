"""
Market Agent Manager
AI-powered agent system that monitors, analyzes, and generates insights
from all collected NSE data. Bloomberg-style intelligent market monitoring.
"""

import asyncio
import logging
import time
from datetime import datetime, time as dt_time
from typing import Any, Dict, List, Optional, Callable

logger = logging.getLogger(__name__)


class MarketAgent:
    """Base class for market monitoring agents."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.status = "idle"
        self.last_run: Optional[str] = None
        self.last_result: Optional[Dict] = None

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        raise NotImplementedError

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "last_run": self.last_run,
        }


class MarketRegimeAgent(MarketAgent):
    """Detects current market regime (trending/ranging/volatile)."""

    def __init__(self):
        super().__init__(
            "Market Regime Detector",
            "Classifies market into trending, ranging, or volatile regimes"
        )

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        self.status = "running"
        try:
            vix_data = data.get("vix", data.get("market_overview", {}).get("vix", {}))
            vix = vix_data.get("vix", 15) if isinstance(vix_data, dict) else 15

            breadth = data.get("market_pulse", data.get("breadth", {}))
            if isinstance(breadth, dict):
                breadth = breadth.get("breadth", breadth)
            ad_ratio = breadth.get("ad_ratio", 1.0) if isinstance(breadth, dict) else 1.0

            indices = data.get("market_overview", {}).get("indices", {})
            key_indices = indices.get("key_indices", {}) if isinstance(indices, dict) else {}
            nifty = key_indices.get("NIFTY 50", {})
            nifty_change = nifty.get("pct_change", 0) if isinstance(nifty, dict) else 0

            # Regime classification
            if vix > 22 and abs(nifty_change) > 1.0:
                regime = "volatile_trending"
                description = "High volatility with strong directional movement"
                strategy = "Trend following with wider stops, avoid naked selling"
            elif vix > 20:
                regime = "volatile"
                description = "Elevated volatility, choppy conditions"
                strategy = "Reduce position sizes, use hedged strategies"
            elif abs(nifty_change) > 0.8 and ad_ratio > 1.5:
                regime = "strong_trend_up"
                description = "Strong bullish trend with broad participation"
                strategy = "Buy dips, momentum strategies, call buying"
            elif abs(nifty_change) > 0.8 and ad_ratio < 0.7:
                regime = "strong_trend_down"
                description = "Strong bearish trend with broad selling"
                strategy = "Sell rallies, put buying, hedge long positions"
            elif vix < 13 and abs(nifty_change) < 0.3:
                regime = "low_vol_range"
                description = "Low volatility range-bound market"
                strategy = "Iron condors, theta decay strategies, sell strangles"
            else:
                regime = "normal"
                description = "Normal market conditions"
                strategy = "Standard directional or neutral strategies"

            result = {
                "regime": regime,
                "description": description,
                "strategy_suggestion": strategy,
                "inputs": {
                    "vix": vix,
                    "ad_ratio": ad_ratio,
                    "nifty_change_pct": nifty_change,
                },
            }
            self.last_result = result
            self.last_run = datetime.now().isoformat()
            self.status = "completed"
            return result

        except Exception as e:
            self.status = "error"
            return {"error": str(e)}


class InstitutionalFlowAgent(MarketAgent):
    """Analyzes FII/DII flows for smart money direction."""

    def __init__(self):
        super().__init__(
            "Institutional Flow Tracker",
            "Tracks FII/DII buying/selling patterns for smart money signals"
        )

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        self.status = "running"
        try:
            institutional = data.get("institutional", {})
            fii_net = institutional.get("fii_net", 0)
            dii_net = institutional.get("dii_net", 0)

            # Flow analysis
            if fii_net > 500:
                fii_signal = "strong_buying"
                fii_msg = f"FIIs are strong net buyers (+{fii_net:.0f} Cr)"
            elif fii_net > 0:
                fii_signal = "buying"
                fii_msg = f"FIIs are net buyers (+{fii_net:.0f} Cr)"
            elif fii_net > -500:
                fii_signal = "selling"
                fii_msg = f"FIIs are net sellers ({fii_net:.0f} Cr)"
            else:
                fii_signal = "strong_selling"
                fii_msg = f"FIIs are heavy net sellers ({fii_net:.0f} Cr)"

            if dii_net > 500:
                dii_signal = "strong_buying"
            elif dii_net > 0:
                dii_signal = "buying"
            elif dii_net > -500:
                dii_signal = "selling"
            else:
                dii_signal = "strong_selling"

            # Combined signal
            total_net = fii_net + dii_net
            if fii_net > 0 and dii_net > 0:
                combined = "both_buying"
                outlook = "Very bullish - both FII and DII accumulating"
            elif fii_net < 0 and dii_net < 0:
                combined = "both_selling"
                outlook = "Very bearish - both FII and DII distributing"
            elif fii_net > 0 and dii_net < 0:
                combined = "fii_buying_dii_selling"
                outlook = "FII-driven rally - watch for sustainability"
            elif fii_net < 0 and dii_net > 0:
                combined = "fii_selling_dii_buying"
                outlook = "DII absorbing FII selling - domestic support"
            else:
                combined = "neutral"
                outlook = "Mixed institutional activity"

            result = {
                "fii": {"net": fii_net, "signal": fii_signal, "message": fii_msg},
                "dii": {"net": dii_net, "signal": dii_signal},
                "combined": combined,
                "outlook": outlook,
                "total_net": total_net,
            }
            self.last_result = result
            self.last_run = datetime.now().isoformat()
            self.status = "completed"
            return result

        except Exception as e:
            self.status = "error"
            return {"error": str(e)}


class OptionsFlowAgent(MarketAgent):
    """Analyzes options data for directional bias and risk levels."""

    def __init__(self):
        super().__init__(
            "Options Flow Analyzer",
            "Analyzes PCR, max pain, IV skew for options-based market signals"
        )

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        self.status = "running"
        try:
            nifty_opts = data.get("nifty_options", {})
            chain_data = nifty_opts.get("chain", {})

            pcr = chain_data.get("pcr", {})
            max_pain = chain_data.get("max_pain", {})
            iv_data = chain_data.get("iv_data", {})
            spot = chain_data.get("spot_price", 0)
            straddle = nifty_opts.get("straddle", {})
            support_resistance = nifty_opts.get("support_resistance", {})
            expected_move = nifty_opts.get("expected_move", {})

            # PCR signal
            pcr_oi = pcr.get("oi", 0)
            if pcr_oi > 1.3:
                pcr_signal = "strong_bullish"
                pcr_msg = f"PCR {pcr_oi:.2f} - Heavy put writing, bullish signal"
            elif pcr_oi > 1.0:
                pcr_signal = "bullish"
                pcr_msg = f"PCR {pcr_oi:.2f} - Moderate put support"
            elif pcr_oi > 0.7:
                pcr_signal = "neutral"
                pcr_msg = f"PCR {pcr_oi:.2f} - Balanced market"
            else:
                pcr_signal = "bearish"
                pcr_msg = f"PCR {pcr_oi:.2f} - Heavy call writing, bearish signal"

            # Max pain analysis
            mp_strike = max_pain.get("strike", 0)
            if spot and mp_strike:
                distance_pct = round(((mp_strike - spot) / spot) * 100, 2)
                if abs(distance_pct) < 0.5:
                    mp_msg = f"Spot near max pain ({mp_strike}) - likely range-bound"
                elif distance_pct > 0:
                    mp_msg = f"Max pain at {mp_strike} ({distance_pct:+.1f}%) - magnetic pull upward"
                else:
                    mp_msg = f"Max pain at {mp_strike} ({distance_pct:+.1f}%) - magnetic pull downward"
            else:
                mp_msg = "Max pain data unavailable"
                distance_pct = 0

            # IV skew
            iv_skew = iv_data.get("iv_skew", 0)
            if iv_skew > 5:
                skew_signal = "fear"
                skew_msg = "Put IV elevated - market pricing downside risk"
            elif iv_skew < -3:
                skew_signal = "complacent"
                skew_msg = "Call IV elevated - unusual upside demand"
            else:
                skew_signal = "normal"
                skew_msg = "IV skew normal - no extreme fear/greed"

            result = {
                "pcr": {"value": pcr_oi, "signal": pcr_signal, "message": pcr_msg},
                "max_pain": {
                    "strike": mp_strike,
                    "distance_pct": distance_pct,
                    "message": mp_msg,
                },
                "iv_skew": {"value": iv_skew, "signal": skew_signal, "message": skew_msg},
                "support": support_resistance.get("support", 0),
                "resistance": support_resistance.get("resistance", 0),
                "expected_move": expected_move,
                "straddle_price": straddle.get("straddle_price", 0),
            }
            self.last_result = result
            self.last_run = datetime.now().isoformat()
            self.status = "completed"
            return result

        except Exception as e:
            self.status = "error"
            return {"error": str(e)}


class GlobalCorrelationAgent(MarketAgent):
    """Analyzes global market correlations for Indian market prediction."""

    def __init__(self):
        super().__init__(
            "Global Correlation Engine",
            "Tracks US/Asia/Europe/Commodity moves for Indian market impact"
        )

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        self.status = "running"
        try:
            global_data = data.get("global_cues", {})
            signals = global_data.get("signals", {})

            us = global_data.get("us_markets", {})
            asian = global_data.get("asian_markets", {})
            commodities = global_data.get("commodities", {})
            currencies = global_data.get("currencies", {})

            # Detailed impact assessment
            impacts = []

            # US impact
            sp500 = us.get("S&P 500", {})
            sp_change = sp500.get("pct_change", 0)
            if abs(sp_change) > 0.5:
                direction = "positive" if sp_change > 0 else "negative"
                impacts.append({
                    "source": "S&P 500",
                    "change": sp_change,
                    "impact": direction,
                    "weight": "high",
                    "message": f"S&P 500 {sp_change:+.1f}% - {direction} for Indian markets",
                })

            # Crude oil impact (inverse for India)
            crude = commodities.get("Crude Oil", {})
            crude_change = crude.get("pct_change", 0)
            if abs(crude_change) > 1:
                direction = "negative" if crude_change > 0 else "positive"
                impacts.append({
                    "source": "Crude Oil",
                    "change": crude_change,
                    "impact": direction,
                    "weight": "medium",
                    "message": f"Crude {crude_change:+.1f}% - {direction} for India (oil importer)",
                })

            # USD/INR
            usd_inr = currencies.get("USD/INR", {})
            usd_change = usd_inr.get("pct_change", 0)
            if abs(usd_change) > 0.2:
                if usd_change > 0:
                    impacts.append({
                        "source": "USD/INR",
                        "change": usd_change,
                        "impact": "mixed",
                        "weight": "medium",
                        "message": f"INR weakening ({usd_change:+.1f}%) - negative for FII flows, positive for IT exports",
                    })

            # Overall sentiment
            bullish = sum(1 for i in impacts if i["impact"] == "positive")
            bearish = sum(1 for i in impacts if i["impact"] == "negative")

            if bullish > bearish:
                global_bias = "bullish"
                summary = "Global cues favor positive opening for Indian markets"
            elif bearish > bullish:
                global_bias = "bearish"
                summary = "Global headwinds suggest cautious start for Indian markets"
            else:
                global_bias = "neutral"
                summary = "Mixed global cues - watch for domestic triggers"

            result = {
                "global_bias": global_bias,
                "summary": summary,
                "impacts": impacts,
                "signals": signals,
            }
            self.last_result = result
            self.last_run = datetime.now().isoformat()
            self.status = "completed"
            return result

        except Exception as e:
            self.status = "error"
            return {"error": str(e)}


class AlertAgent(MarketAgent):
    """Generates real-time alerts for significant market events."""

    def __init__(self):
        super().__init__(
            "Alert Generator",
            "Monitors market data for significant events and generates alerts"
        )
        self._alert_history: List[Dict] = []

    async def analyze(self, data: Dict) -> Dict[str, Any]:
        self.status = "running"
        alerts = []

        try:
            # VIX spike alert
            vix_data = data.get("vix", data.get("market_overview", {}).get("vix", {}))
            if isinstance(vix_data, dict):
                vix = vix_data.get("vix", 0)
                vix_change = vix_data.get("pct_change", 0)
                if vix_change > 5:
                    alerts.append({
                        "type": "vix_spike",
                        "severity": "high",
                        "title": f"VIX Spike: {vix:.1f} (+{vix_change:.1f}%)",
                        "message": "Significant volatility increase detected. Review positions.",
                        "timestamp": datetime.now().isoformat(),
                    })

            # Large index move
            overview = data.get("market_overview", {})
            indices = overview.get("indices", {})
            key_indices = indices.get("key_indices", {}) if isinstance(indices, dict) else {}

            for name, idx_data in key_indices.items():
                if not isinstance(idx_data, dict):
                    continue
                pct = idx_data.get("pct_change", 0)
                if abs(pct) > 1.5:
                    severity = "critical" if abs(pct) > 2.5 else "high"
                    direction = "up" if pct > 0 else "down"
                    alerts.append({
                        "type": "large_index_move",
                        "severity": severity,
                        "title": f"{name}: {pct:+.1f}%",
                        "message": f"{name} has moved {direction} significantly",
                        "timestamp": datetime.now().isoformat(),
                    })

            # PCR extreme
            nifty_opts = data.get("nifty_options", {})
            chain = nifty_opts.get("chain", {})
            pcr = chain.get("pcr", {}) if isinstance(chain, dict) else {}
            pcr_oi = pcr.get("oi", 0) if isinstance(pcr, dict) else 0
            if pcr_oi > 1.5:
                alerts.append({
                    "type": "pcr_extreme",
                    "severity": "medium",
                    "title": f"PCR Extreme: {pcr_oi:.2f}",
                    "message": "Very high put-call ratio - potential bottom formation",
                    "timestamp": datetime.now().isoformat(),
                })
            elif pcr_oi < 0.5 and pcr_oi > 0:
                alerts.append({
                    "type": "pcr_extreme",
                    "severity": "medium",
                    "title": f"PCR Low: {pcr_oi:.2f}",
                    "message": "Very low put-call ratio - potential top formation",
                    "timestamp": datetime.now().isoformat(),
                })

            # Store alerts
            self._alert_history.extend(alerts)
            self._alert_history = self._alert_history[-100:]  # Keep last 100

            result = {
                "active_alerts": alerts,
                "total_alerts": len(alerts),
                "alert_history": self._alert_history[-20:],
            }
            self.last_result = result
            self.last_run = datetime.now().isoformat()
            self.status = "completed"
            return result

        except Exception as e:
            self.status = "error"
            return {"error": str(e)}


class MarketAgentManager:
    """
    Manages all market monitoring agents.
    Runs analysis on collected data and generates unified insights.
    """

    def __init__(self):
        self.agents: Dict[str, MarketAgent] = {
            "regime": MarketRegimeAgent(),
            "institutional": InstitutionalFlowAgent(),
            "options_flow": OptionsFlowAgent(),
            "global_correlation": GlobalCorrelationAgent(),
            "alerts": AlertAgent(),
        }
        self._latest_analysis: Optional[Dict] = None

    async def run_all_agents(self, data: Dict) -> Dict[str, Any]:
        """Run all agents on collected data."""
        start = time.time()
        results = {}

        # Run all agents in parallel
        tasks = {}
        for name, agent in self.agents.items():
            tasks[name] = agent.analyze(data)

        agent_results = await asyncio.gather(
            *tasks.values(), return_exceptions=True
        )

        for name, result in zip(tasks.keys(), agent_results):
            if isinstance(result, Exception):
                logger.error(f"Agent {name} failed: {result}")
                results[name] = {"error": str(result)}
            else:
                results[name] = result

        # Generate unified market summary
        summary = self._generate_summary(results)

        analysis = {
            "agents": results,
            "summary": summary,
            "agent_statuses": {
                name: agent.to_dict() for name, agent in self.agents.items()
            },
            "duration_ms": round((time.time() - start) * 1000, 0),
            "timestamp": datetime.now().isoformat(),
        }

        self._latest_analysis = analysis
        return analysis

    async def run_agent(self, agent_name: str, data: Dict) -> Dict[str, Any]:
        """Run a specific agent."""
        agent = self.agents.get(agent_name)
        if not agent:
            return {"error": f"Unknown agent: {agent_name}"}
        return await agent.analyze(data)

    def _generate_summary(self, results: Dict) -> Dict[str, Any]:
        """Generate a unified market summary from all agent results."""
        signals = []

        # Regime
        regime = results.get("regime", {})
        if isinstance(regime, dict) and "regime" in regime:
            signals.append({
                "source": "Market Regime",
                "signal": regime["regime"],
                "detail": regime.get("description", ""),
            })

        # Institutional
        inst = results.get("institutional", {})
        if isinstance(inst, dict) and "combined" in inst:
            signals.append({
                "source": "Institutional Flows",
                "signal": inst["combined"],
                "detail": inst.get("outlook", ""),
            })

        # Options
        opts = results.get("options_flow", {})
        if isinstance(opts, dict) and "pcr" in opts:
            pcr_data = opts["pcr"]
            if isinstance(pcr_data, dict):
                signals.append({
                    "source": "Options Flow",
                    "signal": pcr_data.get("signal", "neutral"),
                    "detail": pcr_data.get("message", ""),
                })

        # Global
        glob = results.get("global_correlation", {})
        if isinstance(glob, dict) and "global_bias" in glob:
            signals.append({
                "source": "Global Cues",
                "signal": glob["global_bias"],
                "detail": glob.get("summary", ""),
            })

        # Count signals
        bullish = sum(1 for s in signals if "bull" in str(s.get("signal", "")).lower()
                     or s.get("signal") in ("buying", "both_buying", "strong_trend_up"))
        bearish = sum(1 for s in signals if "bear" in str(s.get("signal", "")).lower()
                     or s.get("signal") in ("selling", "both_selling", "strong_trend_down"))

        if bullish > bearish:
            overall = "bullish"
            confidence = min(100, bullish * 25)
        elif bearish > bullish:
            overall = "bearish"
            confidence = min(100, bearish * 25)
        else:
            overall = "neutral"
            confidence = 50

        # Alerts
        alerts = results.get("alerts", {})
        active_alerts = alerts.get("active_alerts", []) if isinstance(alerts, dict) else []

        return {
            "overall_bias": overall,
            "confidence": confidence,
            "signals": signals,
            "active_alerts": len(active_alerts),
            "recommendation": regime.get("strategy_suggestion", "Monitor and wait") if isinstance(regime, dict) else "Monitor and wait",
        }

    @property
    def latest_analysis(self) -> Optional[Dict]:
        return self._latest_analysis

    def get_status(self) -> Dict[str, Any]:
        return {
            "agents": {
                name: agent.to_dict() for name, agent in self.agents.items()
            },
            "has_analysis": self._latest_analysis is not None,
            "last_analysis_time": self._latest_analysis.get("timestamp") if self._latest_analysis else None,
        }
