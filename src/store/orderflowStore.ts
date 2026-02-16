/**
 * Orderflow State Management Store
 * High-performance Zustand store for real-time market data
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface OrderbookLevel {
    price: number;
    size: number;
    total?: number;
}

export interface Trade {
    id?: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    timestamp: number;
}

interface OrderflowState {
    // Connection state
    symbol: string;
    isConnected: boolean;

    // Market data
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
    trades: Trade[];

    // Derived data
    midPrice: number;
    spread: number;
    lastTradePrice: number;

    // Statistics
    buyVolume: number;
    sellVolume: number;

    // Actions
    setSymbol: (symbol: string) => void;
    setConnectionStatus: (status: boolean) => void;
    updateOrderbook: (bids: number[][], asks: number[][], midPrice?: number, spread?: number) => void;
    addTrade: (trade: Trade) => void;
    reset: () => void;
}

const MAX_TRADES = 100;

const initialState = {
    symbol: 'BTCUSDT',
    isConnected: false,
    bids: [] as OrderbookLevel[],
    asks: [] as OrderbookLevel[],
    trades: [] as Trade[],
    midPrice: 0,
    spread: 0,
    lastTradePrice: 0,
    buyVolume: 0,
    sellVolume: 0,
};

export const useOrderflowStore = create<OrderflowState>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setSymbol: (symbol) => {
            // Reset data when changing symbols
            set({
                symbol,
                bids: [],
                asks: [],
                trades: [],
                midPrice: 0,
                spread: 0,
                buyVolume: 0,
                sellVolume: 0,
            });
        },

        setConnectionStatus: (status) => set({ isConnected: status }),

        updateOrderbook: (bidsData, asksData, midPrice, spread) => {
            // Transform [price, size] arrays to objects with cumulative totals
            let bidTotal = 0;
            const bids: OrderbookLevel[] = bidsData.map(([price, size]) => {
                bidTotal += size;
                return { price, size, total: bidTotal };
            });

            let askTotal = 0;
            const asks: OrderbookLevel[] = asksData.map(([price, size]) => {
                askTotal += size;
                return { price, size, total: askTotal };
            });

            set({
                bids,
                asks,
                midPrice: midPrice ?? get().midPrice,
                spread: spread ?? get().spread,
            });
        },

        addTrade: (trade) => {
            const state = get();
            const newTrades = [trade, ...state.trades].slice(0, MAX_TRADES);

            // Update volume statistics
            const volumeDelta = trade.size;
            const buyVolume = trade.side === 'buy'
                ? state.buyVolume + volumeDelta
                : state.buyVolume;
            const sellVolume = trade.side === 'sell'
                ? state.sellVolume + volumeDelta
                : state.sellVolume;

            set({
                trades: newTrades,
                lastTradePrice: trade.price,
                buyVolume,
                sellVolume,
            });
        },

        reset: () => set(initialState),
    }))
);

// Selectors for optimized re-renders
export const selectBids = (state: OrderflowState) => state.bids;
export const selectAsks = (state: OrderflowState) => state.asks;
export const selectTrades = (state: OrderflowState) => state.trades;
export const selectMidPrice = (state: OrderflowState) => state.midPrice;
export const selectIsConnected = (state: OrderflowState) => state.isConnected;
