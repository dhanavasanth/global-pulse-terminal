"""
Monitor / Optimizer Agent
Oversees cycle execution, logs metrics, detects anomalies,
and suggests optimizations for future cycles.
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class MonitorAgent:
    """
    End-of-cycle monitoring agent.
    Reviews all outputs, generates alerts, and suggests optimizations.
    """

    # Performance thresholds
    MAX_CYCLE_DURATION_MS = 30000  # 30 seconds
    MIN_AGENTS_REQUIRED = 4
    VIX_SPIKE_THRESHOLD = 22
    LOW_CONFIDENCE_THRESHOLD = 0.3

    def __init__(self, ollama_client=None):
        self.ollama = ollama_client
        self._cycle_history: List[Dict] = []

    async def run(self, shared_state) -> Dict[str, Any]:
        """Review the current cycle and generate monitoring output."""
        start = time.time()
        full_state = shared_state.get_full_state()

        # 1. Health check
        health = self._check_health(full_state)

        # 2. Performance metrics
        performance = self._compute_performance(full_state)

        # 3. Generate alerts
        alerts = self._generate_alerts(full_state)

        # 4. Optimization suggestions
        optimizations = self._suggest_optimizations(full_state)

        # 5. Track cycle history
        self._cycle_history.append({
            "cycle_id": full_state.get("cycle_id"),
            "timestamp": datetime.now().isoformat(),
            "health": health["status"],
            "alerts_count": len(alerts),
            "duration_ms": full_state.get("cycle_duration_ms", 0),
        })

        result = {
            "health": health,
            "performance": performance,
            "alerts": alerts,
            "optimizations": optimizations,
            "cycle_count": len(self._cycle_history),
            "timestamp": datetime.now().isoformat(),
            "duration_ms": (time.time() - start) * 1000,
        }

        # AI review
        if self.ollama and self.ollama.is_available and alerts:
            review = self._ai_review(full_state, alerts)
            result["ai_review"] = review

        shared_state.set("monitor", result)
        return result

    def _check_health(self, state: Dict) -> Dict[str, Any]:
        """Check overall system health."""
        agents_completed = state.get("agents_completed", [])
        errors = state.get("errors", [])
        cycle_duration = state.get("cycle_duration_ms", 0)

        issues = []

        # Check agent completion
        if len(agents_completed) < self.MIN_AGENTS_REQUIRED:
            issues.append(f"Only {len(agents_completed)}/{self.MIN_AGENTS_REQUIRED} agents completed")

        # Check for errors
        if errors:
            issues.append(f"{len(errors)} agent(s) reported errors: {[e['agent'] for e in errors]}")

        # Check cycle duration
        if cycle_duration > self.MAX_CYCLE_DURATION_MS:
            issues.append(f"Cycle took {cycle_duration:.0f}ms (limit: {self.MAX_CYCLE_DURATION_MS}ms)")

        # Check data freshness
        market_data = state.get("market_data", {})
        if not market_data:
            issues.append("No market data available")

        status = "healthy" if not issues else ("degraded" if len(issues) <= 2 else "unhealthy")

        return {
            "status": status,
            "agents_completed": len(agents_completed),
            "agents_list": agents_completed,
            "errors": len(errors),
            "issues": issues,
        }

    def _compute_performance(self, state: Dict) -> Dict[str, Any]:
        """Compute performance metrics for the cycle."""
        perf = {
            "cycle_duration_ms": state.get("cycle_duration_ms", 0),
            "agent_timings": {},
        }

        # Collect individual agent timings
        for key, value in state.items():
            if key.startswith("agent_") and isinstance(value, dict):
                agent_name = value.get("agent_name", key)
                perf["agent_timings"][agent_name] = {
                    "duration_ms": value.get("duration_ms", 0),
                    "status": value.get("status", "unknown"),
                }

        # Track decision confidence over time
        decision = state.get("decision", {})
        if decision:
            perf["decision_confidence"] = decision.get("confidence", 0)
            perf["primary_action"] = decision.get("primary_action", {}).get("action", "none")

        return perf

    def _generate_alerts(self, state: Dict) -> List[Dict]:
        """Generate alerts based on current state."""
        alerts = []

        # VIX spike alert
        vix = state.get("vix", 0)
        if vix and vix > self.VIX_SPIKE_THRESHOLD:
            alerts.append({
                "type": "vix_spike",
                "severity": "high" if vix > 25 else "medium",
                "message": f"VIX at {vix:.1f} — above threshold ({self.VIX_SPIKE_THRESHOLD}). Consider reducing exposure.",
                "action": "Tighten stop-losses, reduce position sizes",
            })

        # Low confidence alert
        decision = state.get("decision", {})
        confidence = decision.get("confidence", 0)
        if confidence and confidence < self.LOW_CONFIDENCE_THRESHOLD:
            alerts.append({
                "type": "low_confidence",
                "severity": "medium",
                "message": f"Decision confidence at {confidence:.0%} — below threshold. Signals may be conflicting.",
                "action": "Consider waiting for clearer setup",
            })

        # Risk alert
        risk = state.get("risk_metrics", {})
        if risk.get("risk_label") == "high":
            alerts.append({
                "type": "high_risk",
                "severity": "high",
                "message": f"Risk score: {risk.get('risk_score', 0)}/100 — HIGH. Multiple risk factors elevated.",
                "action": "Reduce positions, add hedges",
            })

        # Agent failure alerts
        errors = state.get("errors", [])
        for err in errors:
            alerts.append({
                "type": "agent_error",
                "severity": "medium",
                "message": f"Agent '{err['agent']}' failed: {err.get('error', 'Unknown error')}",
                "action": "Review agent logs, data source may be down",
            })

        # Cycle timeout alert
        duration = state.get("cycle_duration_ms", 0)
        if duration > self.MAX_CYCLE_DURATION_MS:
            alerts.append({
                "type": "cycle_timeout",
                "severity": "low",
                "message": f"Cycle duration {duration:.0f}ms exceeds {self.MAX_CYCLE_DURATION_MS}ms limit",
                "action": "Check Ollama inference speed, consider reducing prompt sizes",
            })

        return alerts

    def _suggest_optimizations(self, state: Dict) -> List[Dict]:
        """Suggest optimizations based on cycle analysis."""
        suggestions = []

        # Check if VIX-based frequency adjustment needed
        vix = state.get("vix", 0)
        if vix and vix > 25:
            suggestions.append({
                "type": "frequency",
                "suggestion": "Increase monitoring frequency from 5min to 2min due to high VIX",
                "priority": "high",
            })

        # Check if agents are slow
        for key, value in state.items():
            if key.startswith("agent_") and isinstance(value, dict):
                duration = value.get("duration_ms", 0)
                if duration > 10000:
                    suggestions.append({
                        "type": "performance",
                        "suggestion": f"Agent '{value.get('agent_name')}' took {duration:.0f}ms — consider optimizing prompts or reducing data size",
                        "priority": "medium",
                    })

        # Track win rate (if positions filled)
        if len(self._cycle_history) >= 10:
            suggestions.append({
                "type": "review",
                "suggestion": f"10+ cycles completed. Review recommendation accuracy. Consider backtesting adjustments.",
                "priority": "medium",
            })

        return suggestions

    def _ai_review(self, state: Dict, alerts: List[Dict]) -> Dict:
        """Use Llama3.1 for cycle review and optimization suggestions."""
        prompt = self.ollama.build_agent_prompt(
            agent_name="Monitor & Optimizer",
            steps=[
                f"Review {len(alerts)} alerts from this cycle",
                "Check if any agent outputs are inconsistent with each other",
                "Assess overall system health and data quality",
                "Suggest specific improvements for the next cycle",
                "If VIX is spiking, recommend emergency protocols",
            ],
            data={
                "alerts": alerts[:5],
                "agents_completed": state.get("agents_completed", []),
                "errors": state.get("errors", []),
                "cycle_duration_ms": state.get("cycle_duration_ms", 0),
                "vix": state.get("vix", 0),
            },
            output_fields=["health_assessment", "inconsistencies", "priority_actions", "prompt_adjustments"],
        )
        return self.ollama.chat_json(prompt)
