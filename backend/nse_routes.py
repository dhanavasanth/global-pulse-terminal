"""
NSE Data API Routes
Bloomberg-style REST API for comprehensive Indian market data.
All routes prefixed with /api/nse/
"""

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nse", tags=["NSE Market Data"])

# These get initialized in main.py
_master_collector = None
_agent_manager = None
_ws_connections: set = set()


def init_nse_services(master_collector, agent_manager):
    """Initialize NSE services (called from main.py)."""
    global _master_collector, _agent_manager
    _master_collector = master_collector
    _agent_manager = agent_manager


def _get_collector():
    if _master_collector is None:
        raise HTTPException(status_code=503, detail="NSE services not initialized")
    return _master_collector


def _get_agents():
    if _agent_manager is None:
        raise HTTPException(status_code=503, detail="Agent manager not initialized")
    return _agent_manager


# ==================== Market Overview ====================

@router.get("/overview")
async def market_overview():
    """Bloomberg-style market overview: indices + VIX + status."""
    collector = _get_collector()
    return await collector.collect_market_overview()


@router.get("/status")
async def market_status():
    """Current market status (open/closed/pre-open)."""
    collector = _get_collector()
    return await collector.equity.collect_market_status()


@router.get("/snapshot")
async def market_snapshot():
    """Get cached snapshot of all available data."""
    collector = _get_collector()
    return collector.get_snapshot()


@router.get("/collector-status")
async def collector_status():
    """Get collector system status."""
    collector = _get_collector()
    return collector.get_status()


# ==================== Indices ====================

@router.get("/indices")
async def all_indices():
    """All NSE indices with real-time data."""
    collector = _get_collector()
    return await collector.equity.collect_all_indices()


@router.get("/indices/{index_name}/stocks")
async def index_stocks(index_name: str):
    """Get all stocks in a specific index."""
    collector = _get_collector()
    # Convert URL-friendly name to NSE format
    name_map = {
        "nifty50": "NIFTY 50",
        "nifty-50": "NIFTY 50",
        "banknifty": "NIFTY BANK",
        "bank-nifty": "NIFTY BANK",
        "nifty-it": "NIFTY IT",
        "nifty-pharma": "NIFTY PHARMA",
        "nifty-auto": "NIFTY AUTO",
        "nifty-fmcg": "NIFTY FMCG",
        "nifty-metal": "NIFTY METAL",
        "nifty-realty": "NIFTY REALTY",
        "nifty-energy": "NIFTY ENERGY",
        "nifty-financial": "NIFTY FINANCIAL SERVICES",
    }
    nse_name = name_map.get(index_name.lower(), index_name.upper().replace("-", " "))
    return await collector.equity.collect_index_stocks(nse_name)


@router.get("/sectors")
async def sectoral_performance():
    """Sectoral indices performance."""
    collector = _get_collector()
    return await collector.collect_sectoral_analysis()


# ==================== Equity ====================

@router.get("/equity/{symbol}")
async def equity_quote(symbol: str):
    """Detailed equity quote for a stock."""
    collector = _get_collector()
    return await collector.equity.collect_equity_quote(symbol.upper())


@router.get("/equity/{symbol}/delivery")
async def equity_delivery(symbol: str):
    """Delivery percentage data for a stock."""
    collector = _get_collector()
    return await collector.equity.collect_delivery_data(symbol.upper())


@router.get("/equity/{symbol}/deep-dive")
async def equity_deep_dive(symbol: str):
    """Deep dive: quote + delivery + options."""
    collector = _get_collector()
    return await collector.collect_stock_deep_dive(symbol.upper())


@router.get("/pre-open")
async def pre_open_data():
    """Pre-market data (8:00-9:15 AM)."""
    collector = _get_collector()
    return await collector.equity.collect_pre_open_data()


# ==================== Options Chain ====================

@router.get("/options/{symbol}")
async def options_chain(symbol: str):
    """Complete options chain for an index or stock."""
    collector = _get_collector()
    is_index = symbol.upper() in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
    return await collector.derivatives.collect_options_chain(symbol.upper(), is_index=is_index)


@router.get("/options/{symbol}/dashboard")
async def options_dashboard(symbol: str):
    """Options dashboard: chain + Greeks + PCR + Max Pain + Expected Move."""
    collector = _get_collector()
    return await collector.collect_options_dashboard(symbol.upper())


@router.get("/options/{symbol}/greeks")
async def options_greeks(symbol: str):
    """Compute Greeks for all options in chain."""
    collector = _get_collector()
    chain_data = await collector.derivatives.collect_options_chain(
        symbol.upper(), is_index=symbol.upper() in ("NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY")
    )
    greeks = collector.metrics.compute_chain_greeks(chain_data)
    return {"symbol": symbol, "greeks": greeks}


@router.get("/options/all-indices/chains")
async def all_index_chains():
    """Options chains for all F&O indices."""
    collector = _get_collector()
    return await collector.derivatives.collect_all_index_chains()


# ==================== Institutional Flows ====================

@router.get("/fii-dii")
async def fii_dii_flows():
    """FII/DII trading activity."""
    collector = _get_collector()
    return await collector.collect_institutional_flows()


# ==================== Volatility ====================

@router.get("/vix")
async def india_vix():
    """Current India VIX with regime analysis."""
    collector = _get_collector()
    return await collector.volatility.collect_india_vix()


@router.get("/vix/history")
async def vix_history(days: int = Query(default=90, le=365)):
    """Historical VIX data."""
    collector = _get_collector()
    return await collector.volatility.collect_vix_history(days)


# ==================== Market Breadth ====================

@router.get("/breadth")
async def market_breadth():
    """Market breadth: advance/decline ratio."""
    collector = _get_collector()
    return await collector.breadth.collect_market_breadth()


@router.get("/pulse")
async def market_pulse():
    """Market pulse: breadth + gainers + losers + most active."""
    collector = _get_collector()
    return await collector.collect_market_pulse()


@router.get("/gainers")
async def top_gainers():
    """Top gaining stocks."""
    collector = _get_collector()
    return await collector.breadth.collect_top_gainers()


@router.get("/losers")
async def top_losers():
    """Top losing stocks."""
    collector = _get_collector()
    return await collector.breadth.collect_top_losers()


@router.get("/most-active")
async def most_active():
    """Most active stocks by volume."""
    collector = _get_collector()
    return await collector.breadth.collect_most_active()


# ==================== Derivatives Intelligence ====================

@router.get("/derivatives-intel")
async def derivatives_intelligence():
    """
    Unified derivatives intelligence: OI spurts + most active contracts + underlyings.
    Single endpoint for the Derivatives Intel page.
    """
    collector = _get_collector()
    return await collector.derivatives.collect_derivatives_intelligence()


@router.get("/oi-spurts")
async def oi_spurts():
    """OI spurts — contracts with sudden large OI changes (intraday signals)."""
    collector = _get_collector()
    return await collector.derivatives.collect_oi_spurts()


@router.get("/most-active-contracts")
async def most_active_contracts():
    """Most active F&O contracts (futures + options by volume/value)."""
    collector = _get_collector()
    return await collector.derivatives.collect_most_active_contracts()


@router.get("/most-active-underlying")
async def most_active_underlying():
    """Most active underlying stocks/indices in F&O segment."""
    collector = _get_collector()
    return await collector.derivatives.collect_most_active_underlying()


# ==================== Corporate Actions ====================

@router.get("/bulk-deals")
async def bulk_deals():
    """Bulk and block deals."""
    collector = _get_collector()
    return await collector.equity.collect_bulk_deals()


@router.get("/corporate-actions")
async def corporate_actions():
    """Upcoming corporate actions."""
    collector = _get_collector()
    return await collector.equity.collect_corporate_actions()


# ==================== Global Markets ====================

@router.get("/global")
async def global_markets():
    """All global markets data."""
    collector = _get_collector()
    return await collector.collect_global_cues()


@router.get("/global/{category}")
async def global_category(category: str):
    """Specific global market category."""
    collector = _get_collector()
    return await collector.global_markets.collect_category(category)


# ==================== News & Sentiment ====================

@router.get("/news")
async def news_feed():
    """Aggregated news with sentiment analysis."""
    collector = _get_collector()
    return await collector.collect_news_sentiment()


@router.get("/news/{source}")
async def news_source(source: str):
    """News from a specific source."""
    collector = _get_collector()
    return await collector.news.collect_source(source)


# ==================== Calculated Metrics ====================

@router.get("/volume-profile")
async def volume_profile(symbol: str = Query(default="NIFTY")):
    """Volume profile analysis."""
    collector = _get_collector()
    # Need historical data for volume profile
    return {"message": "Volume profile requires intraday data collection", "symbol": symbol}


@router.get("/expected-move/{symbol}")
async def expected_move(symbol: str):
    """Expected move based on ATM IV."""
    collector = _get_collector()
    chain_data = await collector.derivatives.collect_options_chain(
        symbol.upper(), is_index=True
    )
    iv_data = chain_data.get("iv_data", {})
    spot = chain_data.get("spot_price", 0)
    atm_iv = iv_data.get("atm_iv_avg", 15)

    current_expiry = chain_data.get("current_expiry", "")
    days = collector.metrics._days_to_expiry(current_expiry)

    return collector.metrics.compute_expected_move(spot, atm_iv, days)


# ==================== AI Agents ====================

@router.get("/agents/status")
async def agents_status():
    """Status of all AI monitoring agents."""
    agents = _get_agents()
    return agents.get_status()


@router.get("/agents/analysis")
async def agents_analysis():
    """Latest analysis from all agents."""
    agents = _get_agents()
    if agents.latest_analysis:
        return agents.latest_analysis
    return {"message": "No analysis available yet. Run a full cycle first."}


@router.post("/agents/run")
async def run_agents():
    """Trigger a full agent analysis cycle."""
    collector = _get_collector()
    agents = _get_agents()

    # Collect data first
    data = await collector.collect_full_cycle()

    # Run agents on collected data
    analysis = await agents.run_all_agents(data)

    # Broadcast to WebSocket clients
    dead = set()
    for ws in _ws_connections:
        try:
            await ws.send_json({"type": "agent_analysis", "data": analysis})
        except Exception:
            dead.add(ws)
    _ws_connections.difference_update(dead)

    return analysis


@router.post("/agents/{agent_name}/run")
async def run_single_agent(agent_name: str):
    """Run a specific agent with latest data."""
    collector = _get_collector()
    agents = _get_agents()
    data = collector.get_snapshot()
    return await agents.run_agent(agent_name, data)


# ==================== Full Cycle ====================

@router.post("/cycle")
async def run_full_cycle():
    """Run a complete data collection + analysis cycle."""
    collector = _get_collector()
    agents = _get_agents()

    # Collect all data
    data = await collector.collect_full_cycle()

    # Run AI analysis
    analysis = await agents.run_all_agents(data)

    return {
        "data": data,
        "analysis": analysis,
    }


@router.post("/start")
async def start_continuous(interval: int = Query(default=60, ge=10, le=600)):
    """Start continuous data collection."""
    collector = _get_collector()
    await collector.start_continuous(interval)
    return {"status": "started", "interval_seconds": interval}


@router.post("/stop")
async def stop_continuous():
    """Stop continuous data collection."""
    collector = _get_collector()
    await collector.stop_continuous()
    return {"status": "stopped"}


# ==================== WebSocket ====================

@router.websocket("/ws")
async def nse_websocket(websocket: WebSocket):
    """WebSocket for real-time NSE data updates."""
    await websocket.accept()
    _ws_connections.add(websocket)
    logger.info(f"NSE WS connected. Total: {len(_ws_connections)}")

    try:
        # Send current status
        collector = _get_collector()
        await websocket.send_json({
            "type": "status",
            "data": collector.get_status(),
        })

        # Send cached snapshot if available
        snapshot = collector.get_snapshot()
        if snapshot:
            await websocket.send_json({
                "type": "snapshot",
                "data": snapshot,
            })

        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Handle commands
                if message == "get_overview":
                    data = await collector.collect_market_overview()
                    await websocket.send_json({"type": "overview", "data": data})
                elif message == "get_options":
                    data = await collector.collect_options_dashboard("NIFTY")
                    await websocket.send_json({"type": "options", "data": data})
                elif message == "run_cycle":
                    data = await collector.collect_full_cycle()
                    agents = _get_agents()
                    analysis = await agents.run_all_agents(data)
                    await websocket.send_json({"type": "full_cycle", "data": data, "analysis": analysis})
                elif message == "get_pulse":
                    data = await collector.collect_market_pulse()
                    await websocket.send_json({"type": "pulse", "data": data})
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"NSE WS error: {e}")
    finally:
        _ws_connections.discard(websocket)
        logger.info(f"NSE WS disconnected. Remaining: {len(_ws_connections)}")
