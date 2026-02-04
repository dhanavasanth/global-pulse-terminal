import { useOptions } from "@/contexts/OptionsContext";
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

const PriceChart = () => {
    const { atmOptionPriceData, isLoading, selectedIndex, atmStrike } = useOptions();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<IChartApi | null>(null);

    // Effect to Initialize and Update Chart
    useEffect(() => {
        if (!chartContainerRef.current || atmOptionPriceData.length === 0) return;

        // Cleanup previous chart
        if (chartApiRef.current) {
            chartApiRef.current.remove();
            chartApiRef.current = null;
        }

        try {
            const container = chartContainerRef.current;
            const width = container.clientWidth || container.parentElement?.clientWidth || 800;
            const height = container.clientHeight || 300;

            if (width === 0 || height === 0) {
                console.warn("PriceChart container has 0 dimensions, skipping render");
                return;
            }

            const chart = createChart(container, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: '#9ca3af',
                },
                grid: {
                    vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
                    horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
                },
                width: width,
                height: height,
                crosshair: {
                    mode: CrosshairMode.Normal,
                },
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.1)',
                },
                timeScale: {
                    borderColor: 'rgba(197, 203, 206, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            chartApiRef.current = chart;
            const chartInstance = chart as any;

            // 1. Call Option Series (Candlesticks - Green theme)
            const callSeries = chartInstance.addCandlestickSeries({
                upColor: '#22c55e',
                downColor: '#22c55e', // Solid green or could be filled vs hollow
                borderUpColor: '#22c55e',
                borderDownColor: '#22c55e',
                wickUpColor: '#22c55e',
                wickDownColor: '#22c55e',
                title: 'Call',
            });

            // 2. Put Option Series (Candlesticks - Red theme)
            // Note: Overlaying two candle series on same scale can be messy if prices overlap perfectly.
            // For ATM they are close. Standard approach: specific colors.
            const putSeries = chartInstance.addCandlestickSeries({
                upColor: '#ef4444',
                downColor: '#ef4444',
                borderUpColor: '#ef4444',
                borderDownColor: '#ef4444',
                wickUpColor: '#ef4444',
                wickDownColor: '#ef4444',
                title: 'Put',
            });

            // 3. VWAP Lines
            const callVWAPSeries = chartInstance.addLineSeries({
                color: '#22c55e', // Green line
                lineWidth: 1,
                lineStyle: 2, // Dashed
                title: 'Call VWAP',
            });

            const putVWAPSeries = chartInstance.addLineSeries({
                color: '#ef4444', // Red line
                lineWidth: 1,
                lineStyle: 2, // Dashed
                title: 'Put VWAP',
            });

            // Prepare Data
            // Lightweight charts needs simplistic Time (string or number timestamp)
            // Our timestamps are strings like "10:30". We need to convert to unique UNIX timestamps based on "today"
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const day = today.getDate();

            const formatData = atmOptionPriceData.map(d => {
                const parts = d.time.split(':');
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);

                // Validate time parsing
                if (isNaN(hours) || isNaN(minutes)) {
                    return null;
                }

                // Create a timestamp for CHART. 
                const timeVal = new Date(year, month, day, hours, minutes).getTime() / 1000;

                // Safe parsing to prevent NaN
                const safeCallO = d.callOpen || d.callPrice || 0;
                const safeCallH = d.callHigh || d.callPrice || 0;
                const safeCallL = d.callLow || d.callPrice || 0;
                const safeCallC = d.callClose || d.callPrice || 0;

                const safePutO = d.putOpen || d.putPrice || 0;
                const safePutH = d.putHigh || d.putPrice || 0;
                const safePutL = d.putLow || d.putPrice || 0;
                const safePutC = d.putClose || d.putPrice || 0;

                return {
                    time: timeVal as any,
                    callCandle: { time: timeVal as any, open: safeCallO, high: safeCallH, low: safeCallL, close: safeCallC },
                    putCandle: { time: timeVal as any, open: safePutO, high: safePutH, low: safePutL, close: safePutC },
                    callVWAP: { time: timeVal as any, value: d.callVWAP || 0 },
                    putVWAP: { time: timeVal as any, value: d.putVWAP || 0 }
                };
            }).filter(d => d !== null) as any[];

            // Set Data
            callSeries.setData(formatData.map(d => d.callCandle));
            putSeries.setData(formatData.map(d => d.putCandle));
            callVWAPSeries.setData(formatData.map(d => d.callVWAP));
            putVWAPSeries.setData(formatData.map(d => d.putVWAP));

            // POC Lines (using last known POC as a horizontal line via PriceLine logic, or a full series if dynamic)
            // POC Lines (using last known POC as a horizontal line via PriceLine logic, or a full series if dynamic)
            // Since POC changes over time, a LineSeries is better.
            const callPOCSeries = chartInstance.addLineSeries({ color: 'rgba(34, 197, 94, 0.5)', lineWidth: 1, title: 'Call POC' });
            const putPOCSeries = chartInstance.addLineSeries({ color: 'rgba(239, 68, 68, 0.5)', lineWidth: 1, title: 'Put POC' });

            const pocData = atmOptionPriceData.map(d => {
                const [hours, minutes] = d.time.split(':').map(Number);
                const timeVal = new Date(year, month, day, hours, minutes).getTime() / 1000;
                return {
                    time: timeVal as any,
                    callPOC: d.callPOC || 0,
                    putPOC: d.putPOC || 0
                };
            });

            callPOCSeries.setData(pocData.map(d => ({ time: d.time, value: d.callPOC })));
            putPOCSeries.setData(pocData.map(d => ({ time: d.time, value: d.putPOC })));

            // Fit Content
            chart.timeScale().fitContent();

            // Resize Observer
            const handleResize = () => {
                if (chartContainerRef.current && chartApiRef.current) {
                    chartApiRef.current.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight
                    });
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartApiRef.current) {
                    chartApiRef.current.remove();
                    chartApiRef.current = null;
                }
            }

        } catch (err) {
            console.error("Failed to initialize PriceChart:", err);
        }
    }, [atmOptionPriceData]);

    if (isLoading || atmOptionPriceData.length === 0) {
        return (
            <div className="glass-card p-4 h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Activity className="w-8 h-8 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading chart...</p>
                </div>
            </div>
        );
    }

    // Header Stats logic
    const latest = atmOptionPriceData[atmOptionPriceData.length - 1];
    const callChange = latest.callClose - latest.callOpen; // Intraday change or candle change? Candle change.
    const putChange = latest.putClose - latest.putOpen;

    return (
        <div className="glass-card p-4 flex flex-col h-full bg-background border border-border/50">
            {/* Minimal Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                            {selectedIndex} {atmStrike} CE/PE
                            <span className="px-1.5 py-0.5 rounded-sm bg-secondary text-[10px] text-muted-foreground font-normal">Dual Candle</span>
                        </h2>
                    </div>
                </div>

                {/* Values */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase">Call (LTP)</span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono font-medium text-bullish">{latest.callClose.toFixed(2)}</span>
                            <span className={`text-[10px] ${callChange >= 0 ? "text-bullish" : "text-bearish"}`}>
                                {callChange >= 0 ? "+" : ""}{callChange.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase">Put (LTP)</span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono font-medium text-bearish">{latest.putClose.toFixed(2)}</span>
                            <span className={`text-[10px] ${putChange >= 0 ? "text-bullish" : "text-bearish"}`}>
                                {putChange >= 0 ? "+" : ""}{putChange.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 w-full min-h-[300px] relative">
                <div ref={chartContainerRef} className="absolute inset-0" />

                {/* Legend Overlay */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2 py-1 rounded border border-border/20">
                        <div className="w-2 h-2 rounded-sm bg-green-500" />
                        <span className="text-[10px] text-muted-foreground">Call Candle</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-2 py-1 rounded border border-border/20">
                        <div className="w-2 h-2 rounded-sm bg-red-500" />
                        <span className="text-[10px] text-muted-foreground">Put Candle</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceChart;
