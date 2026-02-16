"""
NSE Data Infrastructure
Bloomberg-style comprehensive Indian market data collection & analysis.

Modules:
    nse_client       - Session-managed HTTP client for NSE APIs
    equity_collector  - Equity bhavcopy, live quotes, delivery, bulk/block deals
    derivatives_collector - Options chain, F&O bhavcopy, participant OI
    volatility_collector  - India VIX, IV percentile/rank, IV skew
    market_breadth    - Advance/decline, market pulse, sectoral performance
    global_markets    - GIFT Nifty, US/Asian markets, currency, commodities
    news_collector    - RSS feeds, news aggregation, NLP sentiment
    calculated_metrics - Greeks, PCR, Max Pain, Volume Profile, straddle
    master_collector   - Unified orchestrator for all data collection
    agent_manager      - AI agent management for monitoring & alerts
    models             - Pydantic data models
"""

from .master_collector import NSEMasterCollector
from .agent_manager import MarketAgentManager
