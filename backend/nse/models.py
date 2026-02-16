"""
NSE Data Models
Pydantic models for API request/response validation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MarketIndex(BaseModel):
    name: str
    last: float = 0
    open: float = 0
    high: float = 0
    low: float = 0
    prev_close: float = 0
    change: float = 0
    pct_change: float = 0
    pe: Optional[str] = ""
    pb: Optional[str] = ""
    div_yield: Optional[str] = ""


class OptionEntry(BaseModel):
    oi: int = 0
    change_oi: int = 0
    volume: int = 0
    iv: float = 0
    ltp: float = 0
    change: float = 0
    bid_qty: int = 0
    bid_price: float = 0
    ask_price: float = 0
    ask_qty: int = 0


class OptionsChainRow(BaseModel):
    strike: float
    expiry: str = ""
    ce: Optional[OptionEntry] = None
    pe: Optional[OptionEntry] = None


class PCRData(BaseModel):
    oi: float = 0
    volume: float = 0
    signal: str = "neutral"


class MaxPain(BaseModel):
    strike: float = 0
    value: float = 0


class GreeksData(BaseModel):
    delta: float = 0
    gamma: float = 0
    theta: float = 0
    vega: float = 0
    rho: float = 0
    price: float = 0


class AlertData(BaseModel):
    type: str
    severity: str
    title: str
    message: str
    timestamp: str


class AgentStatus(BaseModel):
    name: str
    description: str
    status: str
    last_run: Optional[str] = None


class MarketSummary(BaseModel):
    overall_bias: str = "neutral"
    confidence: int = 50
    signals: List[Dict[str, Any]] = []
    active_alerts: int = 0
    recommendation: str = ""
