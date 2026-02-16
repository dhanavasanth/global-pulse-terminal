"""
AutoTrade Orchestrator
DAG-based workflow engine that coordinates all agents.
Manages intraday cycles with APScheduler integration.
"""

import asyncio
import logging
import time
import json
from datetime import datetime, time as dt_time
from typing import Any, Dict, List, Optional, Callable
from dataclasses import asdict

logger = logging.getLogger(__name__)

from .shared_state import SharedState, CycleLogger, AgentOutput
from .ollama_client import OllamaClient
from .angelone_client import AngelOneClient
from .data_fetcher_agent import DataFetcherAgent
from .sentiment_agent import SentimentAgent
from .technical_agent import TechnicalAgent
from .risk_metrics_agent import RiskMetricsAgent
from .active_trades_agent import ActiveTradesAgent
from .decision_maker_agent import DecisionMakerAgent
from .monitor_agent import MonitorAgent


class AutoTradeOrchestrator:
    """
    Orchestrates the multi-agent workflow:
    1. Data Fetch → 2. Parallel [Sentiment, Technical, Risk, Active] →
    3. Decision Maker → 4. Monitor

    Uses asyncio.gather for parallel execution.
    """

    # Intraday market hours (IST)
    MARKET_OPEN = dt_time(9, 15)
    MARKET_CLOSE = dt_time(15, 30)
    DEFAULT_INTERVAL_MINS = 5

    def __init__(self, ollama_model: str = "llama3.1"):
        # Core infrastructure
        self.shared_state = SharedState()
        self.cycle_logger = CycleLogger()
        self.ollama = OllamaClient(model=ollama_model)
        self.angelone = AngelOneClient()

        # Initialize agents
        self.data_fetcher = DataFetcherAgent(
            ollama_client=self.ollama,
            angelone_client=self.angelone,
        )
        self.sentiment = SentimentAgent(ollama_client=self.ollama)
        self.technical = TechnicalAgent(ollama_client=self.ollama)
        self.risk_metrics = RiskMetricsAgent(ollama_client=self.ollama)
        self.active_trades = ActiveTradesAgent(
            ollama_client=self.ollama, cycle_logger=self.cycle_logger
        )
        self.decision_maker = DecisionMakerAgent(ollama_client=self.ollama)
        self.monitor = MonitorAgent(ollama_client=self.ollama)

        # Orchestrator state
        self._running = False
        self._scheduler_task: Optional[asyncio.Task] = None
        self._latest_result: Optional[Dict] = None
        self._cycle_count = 0
        self._on_cycle_complete: Optional[Callable] = None

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def latest_result(self) -> Optional[Dict]:
        return self._latest_result

    def set_cycle_callback(self, callback: Callable):
        """Register a callback for when a cycle completes."""
        self._on_cycle_complete = callback

    async def run_single_cycle(self) -> Dict[str, Any]:
        """
        Execute one complete orchestration cycle.
        This is the core DAG:
          Fetch → [Sentiment || Technical || Risk || Active] → Decision → Monitor
        """
        cycle_start = time.time()
        self._cycle_count += 1

        # ── Stage 0: Initialize Cycle ──
        cycle_id = self.shared_state.start_cycle()
        self.cycle_logger.log_cycle_start(cycle_id)
        logger.info(f"🔄 Cycle {self._cycle_count} started: {cycle_id}")

        try:
            # ── Stage 1: Data Fetch ──
            fetch_result = await self._run_agent(
                "data_fetcher", self.data_fetcher.run, self.shared_state
            )
            logger.info(f"📊 Data fetched in {fetch_result.duration_ms:.0f}ms")

            # ── Stage 2: Parallel Analysis ──
            parallel_results = await asyncio.gather(
                self._run_agent("sentiment", self.sentiment.run, self.shared_state),
                self._run_agent("technical", self.technical.run, self.shared_state),
                self._run_agent("risk_metrics", self.risk_metrics.run, self.shared_state),
                self._run_agent("active_trades", self.active_trades.run, self.shared_state),
                return_exceptions=True,
            )

            # Log parallel results
            for r in parallel_results:
                if isinstance(r, AgentOutput):
                    logger.info(f"  ✅ {r.agent_name}: {r.status} ({r.duration_ms:.0f}ms)")
                elif isinstance(r, Exception):
                    logger.error(f"  ❌ Parallel agent failed: {r}")

            # ── Stage 3: Decision Maker ──
            decision_result = await self._run_agent(
                "decision_maker", self.decision_maker.run, self.shared_state
            )
            logger.info(f"🎯 Decision: {decision_result.data.get('primary_action', {}).get('action', 'N/A')}")

            # ── Stage 4: Monitor ──
            monitor_result = await self._run_agent(
                "monitor", self.monitor.run, self.shared_state
            )

            # ── Finalize ──
            final_state = self.shared_state.end_cycle()
            self.cycle_logger.log_cycle_end(cycle_id, final_state)

            # Build result summary
            total_ms = (time.time() - cycle_start) * 1000
            result = {
                "cycle_id": cycle_id,
                "cycle_number": self._cycle_count,
                "status": "completed",
                "duration_ms": round(total_ms, 0),
                "timestamp": datetime.now().isoformat(),
                "summary": self._build_summary(final_state),
                "decision": final_state.get("decision", {}),
                "alerts": final_state.get("monitor", {}).get("alerts", []),
                "agents_completed": final_state.get("agents_completed", []),
                "errors": final_state.get("errors", []),
                "market_data": {
                    "ltp": final_state.get("ltp", {}),
                    "vix": final_state.get("vix"),
                },
                "risk": {
                    "score": final_state.get("risk_metrics", {}).get("risk_score", 0),
                    "label": final_state.get("risk_metrics", {}).get("risk_label", "unknown"),
                },
                "sentiment": {
                    "score": final_state.get("sentiment", {}).get("sentiment_score", 0),
                    "label": final_state.get("sentiment", {}).get("label", "neutral"),
                },
                "active_trades": {
                    "top": final_state.get("active_trades", {}).get("top_active", [])[:3],
                    "pcr": final_state.get("active_trades", {}).get("pcr", {}),
                },
            }

            self._latest_result = result
            logger.info(f"✅ Cycle {cycle_id} completed in {total_ms:.0f}ms")

            # Notify callback
            if self._on_cycle_complete:
                await self._safe_callback(result)

            return result

        except Exception as e:
            logger.error(f"❌ Cycle {cycle_id} failed: {e}")
            final_state = self.shared_state.end_cycle()
            self.cycle_logger.log_cycle_end(cycle_id, {**final_state, "error": str(e)})
            error_result = {
                "cycle_id": cycle_id,
                "status": "error",
                "error": str(e),
                "duration_ms": (time.time() - cycle_start) * 1000,
            }
            self._latest_result = error_result
            return error_result

    async def _run_agent(self, name: str, run_fn, shared_state) -> AgentOutput:
        """Run a single agent with error handling and timing."""
        start = time.time()
        try:
            data = await run_fn(shared_state)
            output = AgentOutput(
                agent_name=name,
                timestamp=datetime.now().isoformat(),
                data=data if isinstance(data, dict) else {"result": data},
                duration_ms=(time.time() - start) * 1000,
                status="success",
            )
        except Exception as e:
            logger.error(f"Agent {name} failed: {e}")
            output = AgentOutput(
                agent_name=name,
                timestamp=datetime.now().isoformat(),
                data={},
                duration_ms=(time.time() - start) * 1000,
                status="error",
                error=str(e),
            )

        # Record to shared state and logger
        shared_state.record_agent_output(output)
        self.cycle_logger.log_agent_output(
            shared_state.cycle_id or "unknown", output
        )
        return output

    async def start(self, interval_mins: int = None):
        """Start the orchestrator with scheduled cycles."""
        if self._running:
            logger.warning("Orchestrator already running")
            return

        interval = interval_mins or self.DEFAULT_INTERVAL_MINS
        self._running = True
        logger.info(f"🚀 AutoTrade Orchestrator started (interval: {interval}min)")

        self._scheduler_task = asyncio.create_task(
            self._scheduler_loop(interval)
        )

    async def stop(self):
        """Stop the orchestrator."""
        self._running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 AutoTrade Orchestrator stopped")

    async def _scheduler_loop(self, interval_mins: int):
        """Main scheduler loop — runs cycles at configured intervals."""
        while self._running:
            try:
                # Check if within market hours
                now = datetime.now().time()
                if self.MARKET_OPEN <= now <= self.MARKET_CLOSE:
                    logger.info("⏰ Market hours — running cycle")
                    await self.run_single_cycle()
                else:
                    logger.info(
                        f"🕐 Outside market hours ({now.strftime('%H:%M')}). "
                        f"Market: {self.MARKET_OPEN.strftime('%H:%M')}-{self.MARKET_CLOSE.strftime('%H:%M')}"
                    )

                # Wait for next cycle
                await asyncio.sleep(interval_mins * 60)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(30)  # Wait 30s before retrying

    def get_status(self) -> Dict[str, Any]:
        """Get current orchestrator status."""
        now = datetime.now().time()
        in_market_hours = self.MARKET_OPEN <= now <= self.MARKET_CLOSE

        return {
            "running": self._running,
            "cycle_count": self._cycle_count,
            "in_market_hours": in_market_hours,
            "current_time": datetime.now().isoformat(),
            "market_open": self.MARKET_OPEN.isoformat(),
            "market_close": self.MARKET_CLOSE.isoformat(),
            "ollama_available": self.ollama.is_available,
            "ollama_model": self.ollama.model,
            "angelone_available": self.angelone.is_available,
            "angelone_connected": self.angelone.is_authenticated,
            "latest_cycle": self._latest_result.get("cycle_id") if self._latest_result else None,
            "latest_status": self._latest_result.get("status") if self._latest_result else None,
        }

    def get_history(self, limit: int = 20) -> List[Dict]:
        """Get recent cycle history from the database."""
        return self.cycle_logger.get_recent_cycles(limit)

    def _build_summary(self, state: Dict) -> str:
        """Build a human-readable summary of the cycle."""
        parts = []

        # LTP
        ltp = state.get("ltp", {})
        if ltp:
            ltp_str = ", ".join(f"{k}: ₹{v:,.0f}" for k, v in ltp.items() if isinstance(v, (int, float)))
            parts.append(f"📊 {ltp_str}")

        # VIX
        vix = state.get("vix")
        if vix:
            parts.append(f"📈 VIX: {vix}")

        # Sentiment
        sent = state.get("sentiment", {})
        if sent:
            parts.append(f"💭 Sentiment: {sent.get('label', 'N/A')} ({sent.get('sentiment_score', 0):.2f})")

        # Risk
        risk = state.get("risk_metrics", {})
        if risk:
            parts.append(f"⚠️ Risk: {risk.get('risk_label', 'N/A')} ({risk.get('risk_score', 0)}/100)")

        # Decision
        decision = state.get("decision", {})
        if decision:
            primary = decision.get("primary_action", decision.get("primary", {}))
            if isinstance(primary, dict):
                parts.append(f"🎯 Action: {primary.get('action', 'N/A')} — {primary.get('reason', '')}")

        return " | ".join(parts) if parts else "Cycle completed"

    async def _safe_callback(self, result: Dict):
        """Safely invoke the cycle completion callback."""
        try:
            if asyncio.iscoroutinefunction(self._on_cycle_complete):
                await self._on_cycle_complete(result)
            else:
                self._on_cycle_complete(result)
        except Exception as e:
            logger.error(f"Cycle callback error: {e}")
