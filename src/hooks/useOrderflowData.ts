/**
 * useOrderflowData Hook
 * Manages trade aggregation and footprint bar generation
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useOrderflowStore } from '../store/orderflowStore';
import {
    aggregateToFootprintBar,
    calculateVolumeProfile,
    calculateCumulativeDelta
} from '../utils/deltaCalculator';
import type {
    Trade,
    FootprintBar,
    Timeframe,
    VolumeLevelProfile,
    OrderflowSettings,
    DEFAULT_ORDERFLOW_SETTINGS
} from '../types/orderflow.types';
import { TIMEFRAME_CONFIG } from '../types/orderflow.types';

interface UseOrderflowDataResult {
    footprintBars: FootprintBar[];
    volumeProfile: VolumeLevelProfile[];
    cumulativeDelta: number[];
    currentBar: FootprintBar | null;
    isProcessing: boolean;
}

export function useOrderflowData(
    timeframe: Timeframe = '5s',
    maxBars: number = 100
): UseOrderflowDataResult {
    const trades = useOrderflowStore((state) => state.trades);
    const lastTradePrice = useOrderflowStore((state) => state.lastTradePrice);

    // Store for accumulated bars
    const barsRef = useRef<FootprintBar[]>([]);
    const currentBarTradesRef = useRef<Trade[]>([]);
    const currentBarStartRef = useRef<number>(0);
    const isProcessingRef = useRef(false);

    const timeframeMs = TIMEFRAME_CONFIG[timeframe].milliseconds;

    // Determine tick size based on price
    const tickSize = useMemo(() => {
        if (lastTradePrice > 10000) return 0.5;
        if (lastTradePrice > 1000) return 0.1;
        if (lastTradePrice > 100) return 0.01;
        return 0.001;
    }, [lastTradePrice]);

    // Process new trades and aggregate into bars
    useEffect(() => {
        if (trades.length === 0) return;

        const now = Date.now();
        const latestTrade = trades[0]; // Most recent trade

        // Initialize current bar if needed
        if (currentBarStartRef.current === 0) {
            currentBarStartRef.current = Math.floor(now / timeframeMs) * timeframeMs;
        }

        const barEndTime = currentBarStartRef.current + timeframeMs;

        // Check if we need to close the current bar
        if (now >= barEndTime && currentBarTradesRef.current.length > 0) {
            isProcessingRef.current = true;

            // Create footprint bar from accumulated trades
            const completedBar = aggregateToFootprintBar(
                currentBarTradesRef.current,
                currentBarStartRef.current,
                barEndTime,
                tickSize
            );

            if (completedBar) {
                barsRef.current = [completedBar, ...barsRef.current].slice(0, maxBars);
            }

            // Reset for new bar
            currentBarTradesRef.current = [];
            currentBarStartRef.current = Math.floor(now / timeframeMs) * timeframeMs;
            isProcessingRef.current = false;
        }

        // Add latest trade to current bar
        if (latestTrade) {
            // Check if this trade is not already in our buffer
            const exists = currentBarTradesRef.current.some(t =>
                t.timestamp === latestTrade.timestamp &&
                t.price === latestTrade.price
            );

            if (!exists) {
                currentBarTradesRef.current.push({
                    id: latestTrade.id || `trade-${Date.now()}`,
                    symbol: 'BTCUSDT',
                    timestamp: latestTrade.timestamp,
                    price: latestTrade.price,
                    size: latestTrade.size,
                    side: latestTrade.side,
                });
            }
        }
    }, [trades, timeframeMs, tickSize, maxBars]);

    // Generate current (incomplete) bar for real-time display
    const currentBar = useMemo(() => {
        if (currentBarTradesRef.current.length === 0) return null;

        return aggregateToFootprintBar(
            currentBarTradesRef.current,
            currentBarStartRef.current,
            Date.now(),
            tickSize
        );
    }, [trades, tickSize]); // Re-compute when trades change

    // Calculate volume profile from all bars
    const volumeProfile = useMemo(() => {
        const allBars = currentBar
            ? [currentBar, ...barsRef.current]
            : barsRef.current;
        return calculateVolumeProfile(allBars, tickSize);
    }, [barsRef.current.length, currentBar, tickSize]);

    // Calculate cumulative delta
    const cumulativeDelta = useMemo(() => {
        return calculateCumulativeDelta(barsRef.current);
    }, [barsRef.current.length]);

    return {
        footprintBars: barsRef.current,
        volumeProfile,
        cumulativeDelta,
        currentBar,
        isProcessing: isProcessingRef.current,
    };
}

/**
 * Hook for footprint chart display settings
 */
export function useOrderflowSettings() {
    const settingsRef = useRef<OrderflowSettings>({
        timeframe: '5s',
        displayMode: 'split',
        colorScheme: 'default',
        showPOC: true,
        showVolumeProfile: true,
        showCumulativeDelta: true,
        priceDecimals: 2,
        volumeThreshold: 0,
        cellHeight: 20,
        maxBars: 100,
        imbalanceThreshold: 300,
    });

    const updateSettings = useCallback((updates: Partial<OrderflowSettings>) => {
        settingsRef.current = { ...settingsRef.current, ...updates };
    }, []);

    return {
        settings: settingsRef.current,
        updateSettings,
    };
}
