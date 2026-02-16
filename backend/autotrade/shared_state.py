"""
Shared State & Cycle Logger
Thread-safe shared state dict for inter-agent communication.
SQLite-backed logging for audit trails.
"""

import sqlite3
import json
import threading
import time
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class AgentOutput:
    """Standard output wrapper for all agents."""
    agent_name: str
    timestamp: str
    data: Dict[str, Any]
    duration_ms: float = 0.0
    status: str = "success"  # success | error | skipped
    error: Optional[str] = None


class SharedState:
    """
    Thread-safe shared state for inter-agent communication.
    All agents read/write to this during a cycle.
    """

    def __init__(self):
        self._lock = threading.RLock()
        self._state: Dict[str, Any] = {}
        self._cycle_id: Optional[str] = None
        self._cycle_start: Optional[float] = None

    def start_cycle(self) -> str:
        """Initialize a new cycle and return the cycle ID."""
        with self._lock:
            self._cycle_id = datetime.now().strftime("%Y%m%d_%H%M%S")
            self._cycle_start = time.time()
            self._state = {
                "cycle_id": self._cycle_id,
                "cycle_start": self._cycle_start,
                "agents_completed": [],
                "errors": [],
            }
            return self._cycle_id

    def end_cycle(self) -> Dict[str, Any]:
        """Finalize the current cycle."""
        with self._lock:
            if self._cycle_start:
                self._state["cycle_duration_ms"] = (time.time() - self._cycle_start) * 1000
            self._state["cycle_end"] = datetime.now().isoformat()
            return self.get_full_state()

    def set(self, key: str, value: Any):
        """Set a value in shared state."""
        with self._lock:
            self._state[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Get a value from shared state."""
        with self._lock:
            return self._state.get(key, default)

    def update(self, data: Dict[str, Any]):
        """Merge a dict into shared state."""
        with self._lock:
            self._state.update(data)

    def record_agent_output(self, output: AgentOutput):
        """Record an agent's output into shared state."""
        with self._lock:
            self._state[f"agent_{output.agent_name}"] = asdict(output)
            completed = self._state.get("agents_completed", [])
            completed.append(output.agent_name)
            self._state["agents_completed"] = completed
            if output.status == "error":
                errors = self._state.get("errors", [])
                errors.append({"agent": output.agent_name, "error": output.error})
                self._state["errors"] = errors

    def get_full_state(self) -> Dict[str, Any]:
        """Return a snapshot of the full state."""
        with self._lock:
            return dict(self._state)

    @property
    def cycle_id(self) -> Optional[str]:
        return self._cycle_id


class CycleLogger:
    """
    SQLite-backed logger for audit trails.
    Stores cycle results, agent outputs, and metrics.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), "autotrade_logs.db")
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Create tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cycles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cycle_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    duration_ms REAL,
                    status TEXT DEFAULT 'running',
                    full_state TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS agent_outputs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cycle_id TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    duration_ms REAL,
                    status TEXT,
                    output_json TEXT,
                    error TEXT,
                    FOREIGN KEY (cycle_id) REFERENCES cycles(cycle_id)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS oi_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cycle_id TEXT NOT NULL,
                    strike REAL NOT NULL,
                    option_type TEXT NOT NULL,
                    oi INTEGER,
                    volume INTEGER,
                    ltp REAL,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_oi_strike 
                ON oi_history(strike, option_type)
            """)
            conn.commit()

    def log_cycle_start(self, cycle_id: str):
        """Log the start of a new cycle."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO cycles (cycle_id, timestamp, status) VALUES (?, ?, ?)",
                (cycle_id, datetime.now().isoformat(), "running")
            )
            conn.commit()

    def log_cycle_end(self, cycle_id: str, state: Dict[str, Any]):
        """Log the end of a cycle with full state."""
        duration = state.get("cycle_duration_ms", 0)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "UPDATE cycles SET status=?, duration_ms=?, full_state=? WHERE cycle_id=?",
                ("completed", duration, json.dumps(state, default=str), cycle_id)
            )
            conn.commit()

    def log_agent_output(self, cycle_id: str, output: AgentOutput):
        """Log an individual agent's output."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """INSERT INTO agent_outputs 
                   (cycle_id, agent_name, timestamp, duration_ms, status, output_json, error)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    cycle_id,
                    output.agent_name,
                    output.timestamp,
                    output.duration_ms,
                    output.status,
                    json.dumps(output.data, default=str),
                    output.error,
                )
            )
            conn.commit()

    def log_oi_data(self, cycle_id: str, options_data: List[Dict]):
        """Store OI/volume data for rolling average calculations."""
        with sqlite3.connect(self.db_path) as conn:
            for opt in options_data:
                conn.execute(
                    """INSERT INTO oi_history 
                       (cycle_id, strike, option_type, oi, volume, ltp, timestamp)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        cycle_id,
                        opt.get("strike", 0),
                        opt.get("type", "CE"),
                        opt.get("oi", 0),
                        opt.get("volume", 0),
                        opt.get("ltp", 0),
                        datetime.now().isoformat(),
                    )
                )
            conn.commit()

    def get_oi_history(self, strike: float, option_type: str, limit: int = 5) -> List[Dict]:
        """Get recent OI history for rolling average calculations."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                """SELECT oi, volume, ltp, timestamp FROM oi_history
                   WHERE strike=? AND option_type=?
                   ORDER BY timestamp DESC LIMIT ?""",
                (strike, option_type, limit)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_recent_cycles(self, limit: int = 20) -> List[Dict]:
        """Get recent cycle summaries."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM cycles ORDER BY id DESC LIMIT ?",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_cycle_detail(self, cycle_id: str) -> Optional[Dict]:
        """Get full detail for a specific cycle."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM cycles WHERE cycle_id=?", (cycle_id,)
            ).fetchone()
            if row:
                result = dict(row)
                if result.get("full_state"):
                    result["full_state"] = json.loads(result["full_state"])
                return result
            return None
