/**
 * useContextFootprintData Hook
 * Converts OrderFlowContext candles to FootprintBar format
 */

import { useMemo } from 'react';
import { useOrderFlow, FootprintCandle, PriceLevel } from '../contexts/OrderFlowContext';
import type { FootprintBar, FootprintCell, VolumeLevelProfile } from '../types/orderflow.types';
import { calculateVolumeProfile, calculateCumulativeDelta } from '../utils/deltaCalculator';

interface UseContextFootprintDataResult {
    footprintBars: FootprintBar[];
    volumeProfile: VolumeLevelProfile[];
    cumulativeDelta: number[];
    currentBar: FootprintBar | null;
}

/**
 * Convert PriceLevel from context to FootprintCell
 */
function convertToCell(level: PriceLevel): FootprintCell {
    return {
        price: level.price,
        bidVolume: level.bidVol,
        askVolume: level.askVol,
        delta: level.delta,
        deltaPercent: level.totalVol > 0 ? (level.delta / level.totalVol) * 100 : 0,
        totalVolume: level.totalVol,
        tradeCount: 0, // Not tracked in context
        isPOC: false, // Set below
    };
}

/**
 * Convert FootprintCandle from context to FootprintBar
 */
function convertToFootprintBar(candle: FootprintCandle): FootprintBar {
    const cells = candle.levels.map(convertToCell);

    // Mark POC
    cells.forEach(cell => {
        cell.isPOC = Math.abs(cell.price - candle.poc) < 0.01;
    });

    return {
        timestamp: candle.time,
        openTime: candle.time,
        closeTime: candle.time + 5000, // Approximate
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        cells,
        totalBidVolume: cells.reduce((sum, c) => sum + c.bidVolume, 0),
        totalAskVolume: cells.reduce((sum, c) => sum + c.askVolume, 0),
        totalDelta: candle.delta,
        totalVolume: candle.volume,
        poc: candle.poc,
    };
}

export function useContextFootprintData(): UseContextFootprintDataResult {
    const { candles, currentCandle, tickSize } = useOrderFlow();

    // Convert historical candles to FootprintBars
    const footprintBars = useMemo(() => {
        return candles.map(convertToFootprintBar);
    }, [candles]);

    // Convert current candle
    const currentBar = useMemo(() => {
        if (!currentCandle) return null;
        return convertToFootprintBar(currentCandle);
    }, [currentCandle]);

    // Calculate volume profile from all bars
    const volumeProfile = useMemo(() => {
        const allBars = currentBar
            ? [...footprintBars, currentBar]
            : footprintBars;
        return calculateVolumeProfile(allBars, tickSize);
    }, [footprintBars, currentBar, tickSize]);

    // Calculate cumulative delta
    const cumulativeDelta = useMemo(() => {
        return calculateCumulativeDelta(footprintBars);
    }, [footprintBars]);

    return {
        footprintBars,
        volumeProfile,
        cumulativeDelta,
        currentBar,
    };
}
