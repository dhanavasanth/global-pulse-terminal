import { describe, it, expect } from 'vitest';
import {
    footprintToCandlestick,
    footprintToVolume,
    footprintToDelta,
    footprintToCumulativeDelta,
    singleFootprintToCandlestick,
    singleFootprintToVolume,
} from '@/lib/chartDataAdapters';
import type { FootprintCandle } from '@/contexts/OrderFlowContext';

// Mock FootprintCandle data
const createMockCandle = (overrides: Partial<FootprintCandle> = {}): FootprintCandle => ({
    time: 1704067200000, // 2024-01-01 00:00:00 UTC in ms
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000,
    delta: 150,
    cumDelta: 500,
    poc: 102,
    levels: [],
    isFinished: true,
    ...overrides,
});

describe('chartDataAdapters', () => {
    describe('footprintToCandlestick', () => {
        it('should convert an array of FootprintCandles to CandlestickData', () => {
            const candles = [createMockCandle(), createMockCandle({ time: 1704153600000, close: 108 })];
            const result = footprintToCandlestick(candles);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                time: 1704067200, // Converted to seconds
                open: 100,
                high: 110,
                low: 95,
                close: 105,
            });
            expect(result[1].time).toBe(1704153600);
            expect(result[1].close).toBe(108);
        });

        it('should handle empty array', () => {
            const result = footprintToCandlestick([]);
            expect(result).toEqual([]);
        });
    });

    describe('footprintToVolume', () => {
        it('should convert to HistogramData with correct colors', () => {
            const bullishCandle = createMockCandle({ open: 100, close: 110 }); // close > open = bullish
            const bearishCandle = createMockCandle({ open: 110, close: 100 }); // close < open = bearish

            const result = footprintToVolume([bullishCandle, bearishCandle]);

            expect(result).toHaveLength(2);
            expect(result[0].color).toBe('#26a69a'); // Bullish green
            expect(result[1].color).toBe('#ef5350'); // Bearish red
            expect(result[0].value).toBe(1000);
        });
    });

    describe('footprintToDelta', () => {
        it('should assign colors based on delta sign', () => {
            const positiveDelta = createMockCandle({ delta: 100 });
            const negativeDelta = createMockCandle({ delta: -50 });

            const result = footprintToDelta([positiveDelta, negativeDelta]);

            expect(result[0].color).toBe('#26a69a'); // Positive = green
            expect(result[0].value).toBe(100);
            expect(result[1].color).toBe('#ef5350'); // Negative = red
            expect(result[1].value).toBe(-50);
        });
    });

    describe('footprintToCumulativeDelta', () => {
        it('should use blue/orange colors for cumulative delta', () => {
            const positiveCD = createMockCandle({ cumDelta: 500 });
            const negativeCD = createMockCandle({ cumDelta: -200 });

            const result = footprintToCumulativeDelta([positiveCD, negativeCD]);

            expect(result[0].color).toBe('#2962ff'); // Positive = blue
            expect(result[1].color).toBe('#ff6d00'); // Negative = orange
        });
    });

    describe('singleFootprintToCandlestick', () => {
        it('should convert a single candle', () => {
            const candle = createMockCandle();
            const result = singleFootprintToCandlestick(candle);

            expect(result).toEqual({
                time: 1704067200,
                open: 100,
                high: 110,
                low: 95,
                close: 105,
            });
        });
    });

    describe('singleFootprintToVolume', () => {
        it('should convert a single candle to volume data', () => {
            const candle = createMockCandle({ volume: 2500 });
            const result = singleFootprintToVolume(candle);

            expect(result.value).toBe(2500);
            expect(result.time).toBe(1704067200);
        });
    });
});
