/**
 * LightweightChart Component
 * 
 * A React wrapper around TradingView's Lightweight Charts library (v5.x).
 * Designed to display OHLCV candlestick data with optional volume histogram.
 */

import { useEffect, useRef } from 'react';
import {
    createChart,
    CandlestickSeries,
    HistogramSeries,
    type IChartApi,
    type ISeriesApi,
    type CandlestickData,
    type HistogramData,
    type SeriesType
} from 'lightweight-charts';

export interface LightweightChartProps {
    /** Initial candlestick data */
    data: CandlestickData[];
    /** Optional volume data */
    volumeData?: HistogramData[];
    /** Chart height in pixels */
    height?: number;
    /** Show volume histogram below price */
    showVolume?: boolean;
    /** Callback when chart is ready */
    onChartReady?: (chart: IChartApi) => void;
    /** Class name for container */
    className?: string;
}

export default function LightweightChart({
    data,
    volumeData,
    height = 400,
    showVolume = true,
    onChartReady,
    className = '',
}: LightweightChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    // Initialize chart
    useEffect(() => {
        if (!containerRef.current) return;

        // Create chart with dark theme matching the app
        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: height,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9ca3af',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            crosshair: {
                mode: 1, // Normal crosshair
                vertLine: {
                    color: 'rgba(59, 130, 246, 0.5)',
                    width: 1,
                    style: 2, // Dashed
                    labelBackgroundColor: '#3b82f6',
                },
                horzLine: {
                    color: 'rgba(59, 130, 246, 0.5)',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#3b82f6',
                },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                scaleMargins: {
                    top: 0.1,
                    bottom: showVolume ? 0.25 : 0.1,
                },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: true,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                mouseWheel: true,
                pinch: true,
            },
        });

        chartRef.current = chart;

        // Add candlestick series using v5 API
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        candleSeriesRef.current = candleSeries;

        // Add volume series if enabled
        if (showVolume) {
            const volumeSeries = chart.addSeries(HistogramSeries, {
                color: '#26a69a',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '', // Overlay on main pane
            });

            // Scale volume to bottom of chart
            volumeSeries.priceScale().applyOptions({
                scaleMargins: {
                    top: 0.85,
                    bottom: 0,
                },
            });

            volumeSeriesRef.current = volumeSeries;
        }

        // Notify parent
        onChartReady?.(chart);

        // Handle resize
        const handleResize = () => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            candleSeriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, [height, showVolume, onChartReady]);

    // Update data when it changes
    useEffect(() => {
        if (candleSeriesRef.current && data.length > 0) {
            candleSeriesRef.current.setData(data);
        }
    }, [data]);

    // Update volume data when it changes
    useEffect(() => {
        if (volumeSeriesRef.current && volumeData && volumeData.length > 0) {
            volumeSeriesRef.current.setData(volumeData);
        }
    }, [volumeData]);

    return (
        <div
            ref={containerRef}
            className={`w-full ${className}`}
            style={{ height: `${height}px` }}
        />
    );
}

// Export ref access for advanced usage
export type { IChartApi, ISeriesApi, CandlestickData, HistogramData, SeriesType };
