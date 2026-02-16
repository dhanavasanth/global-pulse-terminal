"""
Crypto Orderflow Analytics Backend
High-performance WebSocket server for real-time market data streaming
"""

# Load .env before any other imports so ANGELONE_* vars are available
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")
load_dotenv()  # also check local .env

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
from typing import Dict, Set, List, Optional
from contextlib import asynccontextmanager
from synthetic_data import OrderbookGenerator, TradeGenerator

# Import stock data services
import fmp_service
import pyth_service

# Import AutoTrade orchestrator
from autotrade.orchestrator import AutoTradeOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state for data generators and connections
class AppState:
    def __init__(self):
        self.generators: Dict[str, OrderbookGenerator] = {}
        self.trade_generators: Dict[str, TradeGenerator] = {}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.broadcast_tasks: Dict[str, asyncio.Task] = {}
    
    def get_or_create_generator(self, symbol: str) -> tuple:
        if symbol not in self.generators:
            # Default prices for different symbols
            base_prices = {
                "BTCUSDT": 65000.0,
                "ETHUSDT": 3500.0,
                "SOLUSDT": 150.0,
            }
            base_price = base_prices.get(symbol, 1000.0)
            self.generators[symbol] = OrderbookGenerator(symbol, base_price)
            self.trade_generators[symbol] = TradeGenerator(symbol, self.generators[symbol])
            self.active_connections[symbol] = set()
        return self.generators[symbol], self.trade_generators[symbol]

state = AppState()
autotrade_orchestrator = AutoTradeOrchestrator()
autotrade_ws_connections: Set[WebSocket] = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Market Analytics Backend")
    yield
    # Cleanup on shutdown
    if autotrade_orchestrator.is_running:
        await autotrade_orchestrator.stop()
    for task in state.broadcast_tasks.values():
        task.cancel()
    logger.info("👋 Shutting down...")

app = FastAPI(
    title="Market Analytics API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Market Analytics Backend",
        "version": "2.0.0",
        "active_symbols": list(state.generators.keys())
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "connections": {
            symbol: len(conns) 
            for symbol, conns in state.active_connections.items()
        }
    }

# ============= Stock Data API Routes =============

@app.get("/api/stock/search")
async def search_stocks(q: str = Query(..., min_length=1), limit: int = 10):
    """Search for stock symbols"""
    try:
        return await fmp_service.search_symbols(q, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/profile/{symbol}")
async def get_stock_profile(symbol: str):
    """Get company profile"""
    try:
        return await fmp_service.get_profile(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/quote/{symbol}")
async def get_stock_quote(symbol: str):
    """Get real-time quote"""
    try:
        return await fmp_service.get_quote(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/batch-quote")
async def get_batch_quotes(symbols: str = Query(...)):
    """Get quotes for multiple symbols (comma-separated)"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        return await fmp_service.get_batch_quotes(symbol_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/key-metrics/{symbol}")
async def get_key_metrics(symbol: str, period: str = "annual"):
    """Get key metrics"""
    try:
        return await fmp_service.get_key_metrics(symbol.upper(), period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/key-metrics-ttm/{symbol}")
async def get_key_metrics_ttm(symbol: str):
    """Get TTM key metrics"""
    try:
        return await fmp_service.get_key_metrics_ttm(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/ratios/{symbol}")
async def get_ratios(symbol: str, period: str = "annual"):
    """Get financial ratios"""
    try:
        return await fmp_service.get_ratios(symbol.upper(), period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/ratios-ttm/{symbol}")
async def get_ratios_ttm(symbol: str):
    """Get TTM ratios"""
    try:
        return await fmp_service.get_ratios_ttm(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/income-statement/{symbol}")
async def get_income_statement(symbol: str, period: str = "annual", limit: int = 5):
    """Get income statements"""
    try:
        return await fmp_service.get_income_statement(symbol.upper(), period, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/balance-sheet/{symbol}")
async def get_balance_sheet(symbol: str, period: str = "annual", limit: int = 5):
    """Get balance sheet"""
    try:
        return await fmp_service.get_balance_sheet(symbol.upper(), period, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/cash-flow/{symbol}")
async def get_cash_flow(symbol: str, period: str = "annual", limit: int = 5):
    """Get cash flow statements"""
    try:
        return await fmp_service.get_cash_flow(symbol.upper(), period, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/historical/{symbol}")
async def get_historical_price(symbol: str, from_date: Optional[str] = None, to_date: Optional[str] = None):
    """Get historical price data"""
    try:
        return await fmp_service.get_historical_price(symbol.upper(), from_date, to_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/price-change/{symbol}")
async def get_price_change(symbol: str):
    """Get price change percentages"""
    try:
        return await fmp_service.get_price_change(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/earnings/{symbol}")
async def get_earnings(symbol: str, limit: int = 10):
    """Get earnings history"""
    try:
        return await fmp_service.get_earnings_history(symbol.upper(), limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/dividends/{symbol}")
async def get_dividends(symbol: str):
    """Get dividend history"""
    try:
        return await fmp_service.get_dividends(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/splits/{symbol}")
async def get_splits(symbol: str):
    """Get stock splits"""
    try:
        return await fmp_service.get_stock_splits(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/insider-trading/{symbol}")
async def get_insider_trading(symbol: str, limit: int = 20):
    """Get insider trading data"""
    try:
        return await fmp_service.get_insider_trading(symbol.upper(), limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/institutional/{symbol}")
async def get_institutional(symbol: str):
    """Get institutional ownership"""
    try:
        return await fmp_service.get_institutional_holders(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/executives/{symbol}")
async def get_executives(symbol: str):
    """Get company executives"""
    try:
        return await fmp_service.get_key_executives(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/peers/{symbol}")
async def get_peers(symbol: str):
    """Get peer companies"""
    try:
        return await fmp_service.get_stock_peers(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/price-target/{symbol}")
async def get_price_target(symbol: str):
    """Get analyst price targets"""
    try:
        return await fmp_service.get_price_target(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/sec-filings/{symbol}")
async def get_sec_filings(symbol: str, limit: int = 20):
    """Get SEC filings"""
    try:
        return await fmp_service.get_sec_filings(symbol.upper(), limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/revenue-segments/{symbol}")
async def get_revenue_segments(symbol: str):
    """Get revenue by product segment"""
    try:
        return await fmp_service.get_revenue_segmentation(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/revenue-geography/{symbol}")
async def get_revenue_geography(symbol: str):
    """Get revenue by geography"""
    try:
        return await fmp_service.get_revenue_geography(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/financial-scores/{symbol}")
async def get_financial_scores(symbol: str):
    """Get financial health scores"""
    try:
        return await fmp_service.get_financial_scores(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/market-overview")
async def get_market_overview():
    """Get market overview (major indices)"""
    try:
        return await fmp_service.get_market_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============= Pyth Live Price Routes =============

@app.get("/api/live-price/{symbol}")
async def get_live_price(symbol: str):
    """Get real-time price from Pyth Network"""
    result = await pyth_service.get_price(symbol.upper())
    if result is None:
        raise HTTPException(status_code=404, detail=f"No Pyth feed for {symbol}")
    return result

@app.get("/api/live-price/batch")
async def get_live_prices(symbols: str = Query(...)):
    """Get real-time prices for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    return await pyth_service.get_multiple_prices(symbol_list)

@app.get("/api/live-price/available")
async def get_available_feeds():
    """Get list of available Pyth price feeds"""
    return {"symbols": pyth_service.get_available_symbols()}

# ============= AutoTrade AI Routes =============

@app.get("/api/autotrade/status")
async def autotrade_status():
    """Get AutoTrade orchestrator status"""
    return autotrade_orchestrator.get_status()

@app.get("/api/autotrade/latest")
async def autotrade_latest():
    """Get latest cycle results"""
    result = autotrade_orchestrator.latest_result
    if result is None:
        return {"status": "no_cycles", "message": "No cycles have been run yet"}
    return result

@app.post("/api/autotrade/start")
async def autotrade_start(interval_mins: int = 5):
    """Start the AutoTrade orchestrator"""
    if autotrade_orchestrator.is_running:
        return {"status": "already_running"}

    # Set up WebSocket broadcast callback
    async def broadcast_cycle(result):
        dead = set()
        for ws in autotrade_ws_connections:
            try:
                await ws.send_json(result)
            except Exception:
                dead.add(ws)
        autotrade_ws_connections.difference_update(dead)

    autotrade_orchestrator.set_cycle_callback(broadcast_cycle)
    await autotrade_orchestrator.start(interval_mins=interval_mins)
    return {"status": "started", "interval_mins": interval_mins}

@app.post("/api/autotrade/stop")
async def autotrade_stop():
    """Stop the AutoTrade orchestrator"""
    if not autotrade_orchestrator.is_running:
        return {"status": "not_running"}
    await autotrade_orchestrator.stop()
    return {"status": "stopped"}

@app.post("/api/autotrade/cycle")
async def autotrade_run_cycle():
    """Manually trigger a single cycle (works outside market hours too)"""
    result = await autotrade_orchestrator.run_single_cycle()
    # Broadcast to WebSocket clients
    dead = set()
    for ws in autotrade_ws_connections:
        try:
            await ws.send_json(result)
        except Exception:
            dead.add(ws)
    autotrade_ws_connections.difference_update(dead)
    return result

@app.get("/api/autotrade/history")
async def autotrade_history(limit: int = 20):
    """Get cycle history"""
    return {"cycles": autotrade_orchestrator.get_history(limit)}

@app.websocket("/ws/autotrade")
async def autotrade_websocket(websocket: WebSocket):
    """WebSocket for real-time AutoTrade cycle updates"""
    await websocket.accept()
    autotrade_ws_connections.add(websocket)
    logger.info(f"🤖 AutoTrade WS connected. Total: {len(autotrade_ws_connections)}")

    try:
        # Send current status immediately
        await websocket.send_json({
            "type": "status",
            "data": autotrade_orchestrator.get_status(),
        })
        # Send latest result if available
        if autotrade_orchestrator.latest_result:
            await websocket.send_json({
                "type": "cycle_result",
                "data": autotrade_orchestrator.latest_result,
            })

        # Keep alive
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Handle client commands
                if message == "run_cycle":
                    result = await autotrade_orchestrator.run_single_cycle()
                    await websocket.send_json({"type": "cycle_result", "data": result})
                elif message == "get_status":
                    await websocket.send_json({
                        "type": "status",
                        "data": autotrade_orchestrator.get_status(),
                    })
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"AutoTrade WS error: {e}")
    finally:
        autotrade_ws_connections.discard(websocket)
        logger.info(f"🔌 AutoTrade WS disconnected. Remaining: {len(autotrade_ws_connections)}")

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "connections": {
            symbol: len(conns) 
            for symbol, conns in state.active_connections.items()
        }
    }

async def send_market_data(websocket: WebSocket, symbol: str):
    """
    Continuously send market data to a single client.
    Uses per-connection task for better isolation.
    """
    orderbook_gen, trade_gen = state.get_or_create_generator(symbol)
    
    try:
        while True:
            # Generate and send orderbook update
            ob_data = orderbook_gen.update()
            await websocket.send_json(ob_data)
            
            # Generate trade every other update
            if orderbook_gen.last_update_id % 2 == 0:
                trade_data = trade_gen.generate()
                await websocket.send_json(trade_data)
            
            # 100ms update rate (~10 updates/second)
            await asyncio.sleep(0.1)
            
    except Exception as e:
        logger.debug(f"Data stream ended for {symbol}: {e}")
        raise

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """
    WebSocket endpoint for real-time market data.
    Each connection gets its own data stream task.
    """
    await websocket.accept()
    symbol = symbol.upper()
    
    # Initialize generator if needed
    state.get_or_create_generator(symbol)
    state.active_connections[symbol].add(websocket)
    
    logger.info(f"✅ Client connected to {symbol}. Total: {len(state.active_connections[symbol])}")
    
    # Create data streaming task for this connection
    data_task = asyncio.create_task(send_market_data(websocket, symbol))
    
    try:
        # Keep connection alive by listening for any client messages
        while True:
            try:
                # Wait for client messages (ping/pong or commands)
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0  # 30 second timeout
                )
                # Handle any client commands here if needed
                logger.debug(f"Received from client: {message}")
            except asyncio.TimeoutError:
                # Send ping to check if client is still alive
                try:
                    await websocket.send_json({"type": "ping"})
                except:
                    break
                    
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {symbol}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup
        data_task.cancel()
        try:
            await data_task
        except asyncio.CancelledError:
            pass
        
        if websocket in state.active_connections.get(symbol, set()):
            state.active_connections[symbol].discard(websocket)
            logger.info(f"🔌 Connection closed for {symbol}. Remaining: {len(state.active_connections[symbol])}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
