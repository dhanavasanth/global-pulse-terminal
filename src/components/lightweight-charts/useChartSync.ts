/**
 * useChartSync Hook
 * 
 * Synchronizes OrderFlowContext data with Lightweight Charts.
 * Provides converted data and real-time update functions.
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import {
    footprintToCandlestick,
    footprintToVolume,
    singleFootprintToCandlestick,
    singleFootprintToVolume,
    type CandlestickData,
    type HistogramData,
} from '@/lib/chartDataAdapters';
import type { ISeriesApi } from 'lightweight-charts';

export interface ChartSyncResult {
    /** Converted candlestick data for initial render */
    candlestickData: CandlestickData[];
    /** Converted volume data for initial render */
    volumeData: HistogramData[];
    /** Current symbol being tracked */
    symbol: string;
    /** Last price */
    lastPrice: number;
    /** Is connected to data feed */
    isConnected: boolean;
    /** Function to bind series for real-time updates */
    bindCandleSeries: (series: ISeriesApi<'Candlestick'>) => void;
    /** Function to bind volume series for real-time updates */
    bindVolumeSeries: (series: ISeriesApi<'Histogram'>) => void;
}

/**
 * Hook to synchronize OrderFlowContext with Lightweight Charts
 */
export function useChartSync(): ChartSyncResult {
    const { candles, currentCandle, symbol, lastPrice, isConnected } = useOrderFlow();

    // Refs to hold bound series for real-time updates
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    // Convert historical candles (memoized)
    const candlestickData = useMemo(() => {
        return footprintToCandlestick(candles);
    }, [candles]);

    const volumeData = useMemo(() => {
        return footprintToVolume(candles);
    }, [candles]);

    // Bind functions for real-time updates
    const bindCandleSeries = useCallback((series: ISeriesApi<'Candlestick'>) => {
        candleSeriesRef.current = series;
    }, []);

    const bindVolumeSeries = useCallback((series: ISeriesApi<'Histogram'>) => {
        volumeSeriesRef.current = series;
    }, []);

    // Real-time updates when currentCandle changes
    useEffect(() => {
        if (!currentCandle) return;

        // Update candlestick series
        if (candleSeriesRef.current) {
            const candleData = singleFootprintToCandlestick(currentCandle);
            candleSeriesRef.current.update(candleData);
        }

        // Update volume series
        if (volumeSeriesRef.current) {
            const volData = singleFootprintToVolume(currentCandle);
            volumeSeriesRef.current.update(volData);
        }
    }, [currentCandle]);

    return {
        candlestickData,
        volumeData,
        symbol,
        lastPrice,
        isConnected,
        bindCandleSeries,
        bindVolumeSeries,
    };
}

export default useChartSync;
