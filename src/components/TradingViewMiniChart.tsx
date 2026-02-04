/**
 * TradingViewMiniChart Component
 * 
 * Embeds TradingView's Mini Chart widget for quick price reference.
 * Designed for compact spaces like the OptionsLab page.
 */

import { useEffect, useRef } from 'react';

export interface TradingViewMiniChartProps {
    /** Symbol to display (e.g., "NASDAQ:AAPL") */
    symbol?: string;
    /** Chart width (or "100%" for responsive) */
    width?: number | string;
    /** Chart height */
    height?: number;
    /** Enable autosize */
    isAutosize?: boolean;
    /** Date range - options: "1D", "1M", "3M", "12M", "60M", "ALL" */
    dateRange?: string;
    /** Color theme - "light" or "dark" */
    colorTheme?: 'light' | 'dark';
    /** Trend line color */
    trendLineColor?: string;
    /** Under area bottom color */
    underLineColor?: string;
    /** Under area top color */
    underLineBottomColor?: string;
    /** Locale */
    locale?: string;
    /** Container class name */
    className?: string;
}

export default function TradingViewMiniChart({
    symbol = 'NASDAQ:AAPL',
    width = '100%',
    height = 220,
    isAutosize = true,
    dateRange = '1D',
    colorTheme = 'dark',
    trendLineColor = 'rgba(59, 130, 246, 1)',
    underLineColor = 'rgba(59, 130, 246, 0.3)',
    underLineBottomColor = 'rgba(59, 130, 246, 0)',
    locale = 'en',
    className = '',
}: TradingViewMiniChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create container div for widget
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        containerRef.current.appendChild(widgetContainer);

        // Create and load script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol,
            width: isAutosize ? '100%' : width,
            height,
            locale,
            dateRange,
            colorTheme,
            trendLineColor,
            underLineColor,
            underLineBottomColor,
            isTransparent: true,
            autosize: isAutosize,
            largeChartUrl: '',
            noTimeScale: false,
        });

        containerRef.current.appendChild(script);
        scriptRef.current = script;

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [
        symbol,
        width,
        height,
        isAutosize,
        dateRange,
        colorTheme,
        trendLineColor,
        underLineColor,
        underLineBottomColor,
        locale,
    ]);

    return (
        <div
            ref={containerRef}
            className={`tradingview-widget-container ${className}`}
            style={{ height: `${height}px` }}
        />
    );
}
