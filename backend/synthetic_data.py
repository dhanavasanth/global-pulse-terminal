"""
Synthetic Market Data Generator
Produces realistic orderbook and trade data for testing
"""

import random
import time
import math
from typing import List, Dict
from dataclasses import dataclass, field

@dataclass
class OrderbookGenerator:
    """
    Generates synthetic L2 orderbook data with realistic market dynamics.
    Uses a random walk with mean reversion for price movement.
    """
    symbol: str
    mid_price: float
    spread_bps: float = 5.0  # Spread in basis points
    depth_levels: int = 20
    volatility: float = 0.0002  # Price volatility per tick
    mean_reversion: float = 0.1
    initial_price: float = field(init=False)
    last_update_id: int = 0
    
    def __post_init__(self):
        self.initial_price = self.mid_price
        self._tick_size = self._calculate_tick_size()
    
    def _calculate_tick_size(self) -> float:
        """Determine appropriate tick size based on price"""
        if self.mid_price > 10000:
            return 0.5
        elif self.mid_price > 1000:
            return 0.1
        elif self.mid_price > 100:
            return 0.01
        else:
            return 0.001
    
    def _generate_size(self, distance_from_mid: int) -> float:
        """
        Generate order size based on distance from mid price.
        More liquidity further from the spread (realistic ladder)
        """
        base_size = random.uniform(0.1, 2.0)
        # Increase size with distance (liquidity pools away from mid)
        distance_multiplier = 1 + (distance_from_mid * 0.2)
        # Add some randomness
        noise = random.uniform(0.5, 1.5)
        return round(base_size * distance_multiplier * noise, 4)
    
    def update(self) -> Dict:
        """
        Generate next orderbook snapshot with realistic price movement.
        """
        # Random walk with mean reversion
        random_change = random.gauss(0, self.volatility * self.mid_price)
        reversion = self.mean_reversion * (self.initial_price - self.mid_price)
        self.mid_price += random_change + reversion * 0.01
        
        # Calculate spread
        half_spread = (self.mid_price * self.spread_bps / 10000) / 2
        
        # Generate orderbook levels
        bids: List[List[float]] = []
        asks: List[List[float]] = []
        
        for i in range(self.depth_levels):
            # Bid prices decrease from mid
            bid_price = round(self.mid_price - half_spread - (i * self._tick_size), 2)
            bid_size = self._generate_size(i)
            bids.append([bid_price, bid_size])
            
            # Ask prices increase from mid
            ask_price = round(self.mid_price + half_spread + (i * self._tick_size), 2)
            ask_size = self._generate_size(i)
            asks.append([ask_price, ask_size])
        
        self.last_update_id += 1
        
        return {
            "type": "orderbook",
            "symbol": self.symbol,
            "timestamp": int(time.time() * 1000),
            "lastUpdateId": self.last_update_id,
            "midPrice": round(self.mid_price, 2),
            "spread": round(half_spread * 2, 2),
            "bids": bids,
            "asks": asks
        }


@dataclass
class TradeGenerator:
    """
    Generates synthetic trade execution data.
    Simulates market orders hitting the book.
    """
    symbol: str
    price_ref: OrderbookGenerator
    trade_id: int = 0
    
    def generate(self) -> Dict:
        """Generate a synthetic trade"""
        # Determine trade direction with slight bias based on price movement
        price_momentum = self.price_ref.mid_price - self.price_ref.initial_price
        buy_probability = 0.5 + (price_momentum / self.price_ref.initial_price) * 10
        buy_probability = max(0.3, min(0.7, buy_probability))  # Clamp between 0.3 and 0.7
        
        is_buy = random.random() < buy_probability
        
        # Price at or near the top of book (market order fills)
        spread_offset = random.uniform(0, 0.1) * self.price_ref._tick_size
        if is_buy:
            # Buying hits the ask
            price = self.price_ref.mid_price + spread_offset
        else:
            # Selling hits the bid
            price = self.price_ref.mid_price - spread_offset
        
        # Trade size follows a power law distribution (many small, few large)
        base_size = random.uniform(0.001, 0.5)
        if random.random() < 0.05:  # 5% chance of large trade
            base_size *= random.uniform(5, 20)
        
        self.trade_id += 1
        
        return {
            "type": "trade",
            "id": f"{self.symbol}-{self.trade_id}",
            "symbol": self.symbol,
            "timestamp": int(time.time() * 1000),
            "price": round(price, 2),
            "size": round(base_size, 4),
            "side": "buy" if is_buy else "sell"
        }
