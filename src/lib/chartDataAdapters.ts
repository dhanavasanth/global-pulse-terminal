/**
 * Chart Data Adapters
 * 
 * Utility functions to convert between different chart data formats:
 * - FootprintCandle (custom order flow format)
 * - CandlestickData (Lightweight Charts format)
 * - HistogramData (Lightweight Charts volume format)
 */

import type { CandlestickData, HistogramData, Time } from 'lightweight-charts';
import type { FootprintCandle } from '@/contexts/OrderFlowContext';

/**
 * Converts FootprintCandle array to Lightweight Charts CandlestickData format
 */
export function footprintToCandlestick(candles: FootprintCandle[]): CandlestickData[] {
    return candles.map(candle => ({
        time: Math.floor(candle.time / 1000) as Time, // Convert ms to seconds (Unix timestamp)
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
    }));
}

/**
 * Converts FootprintCandle array to Lightweight Charts HistogramData for volume
 */
export function footprintToVolume(candles: FootprintCandle[]): HistogramData[] {
    return candles.map(candle => ({
        time: Math.floor(candle.time / 1000) as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? '#26a69a' : '#ef5350', // Bullish green, bearish red
    }));
}

/**
 * Converts FootprintCandle array to Lightweight Charts HistogramData for delta
 */
export function footprintToDelta(candles: FootprintCandle[]): HistogramData[] {
    return candles.map(candle => ({
        time: Math.floor(candle.time / 1000) as Time,
        value: candle.delta,
        color: candle.delta >= 0 ? '#26a69a' : '#ef5350',
    }));
}

/**
 * Converts FootprintCandle array to Lightweight Charts HistogramData for cumulative delta
 */
export function footprintToCumulativeDelta(candles: FootprintCandle[]): HistogramData[] {
    return candles.map(candle => ({
        time: Math.floor(candle.time / 1000) as Time,
        value: candle.cumDelta,
        color: candle.cumDelta >= 0 ? '#2962ff' : '#ff6d00', // Blue for positive, orange for negative
    }));
}

/**
 * Extracts Point of Control (POC) prices for overlay on chart
 */
export function extractPOCMarkers(candles: FootprintCandle[]): Array<{ time: Time; price: number }> {
    return candles.map(candle => ({
        time: Math.floor(candle.time / 1000) as Time,
        price: candle.poc,
    }));
}

/**
 * Converts a single FootprintCandle to Lightweight Charts format (for real-time updates)
 */
export function singleFootprintToCandlestick(candle: FootprintCandle): CandlestickData {
    return {
        time: Math.floor(candle.time / 1000) as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
    };
}

/**
 * Converts a single FootprintCandle to volume bar
 */
export function singleFootprintToVolume(candle: FootprintCandle): HistogramData {
    return {
        time: Math.floor(candle.time / 1000) as Time,
        value: candle.volume,
        color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
    };
}

// Type exports for consumers
export type { CandlestickData, HistogramData, Time };
