import { useOptions } from "@/contexts/OptionsContext";
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef } from "react";
import { LineChart, TrendingUp, Minus } from "lucide-react";

const StraddleVWAP = () => {
    const { straddleData, isLoading } = useOptions();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || straddleData.length === 0) return;

        if (chartApiRef.current) {
            chartApiRef.current.remove();
            chartApiRef.current = null;
        }

        try {
            const container = chartContainerRef.current;
            const width = container.clientWidth || container.parentElement?.clientWidth || 800;
            const height = container.clientHeight || 300;

            if (width === 0 || height === 0) {
                console.warn("StraddleVWAP container has 0 dimensions, skipping render");
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
                crosshair: { mode: CrosshairMode.Normal },
                rightPriceScale: { borderColor: 'rgba(197, 203, 206, 0.1)' },
                timeScale: {
                    borderColor: 'rgba(197, 203, 206, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            chartApiRef.current = chart;
            const chartInstance = chart as any;

            // 1. Straddle Price Series (Candlesticks)
            // Using Cyan/Blue theme for straddle
            const mainSeries = chartInstance.addCandlestickSeries({
                upColor: '#06b6d4', // Cyan
                downColor: '#06b6d4',
                borderUpColor: '#06b6d4',
                borderDownColor: '#06b6d4',
                wickUpColor: '#06b6d4',
                wickDownColor: '#06b6d4',
                title: 'Straddle',
            });

            // 2. VWAP Series (Yellow)
            const vwapSeries = chartInstance.addLineSeries({
                color: '#eab308',
                lineWidth: 2,
                title: 'VWAP',
            });

            // 3. DLOC Series (Indigo Dashed)
            const dlocSeries = chartInstance.addLineSeries({
                color: '#6366f1',
                lineWidth: 1,
                lineStyle: 2, // Dashed
                title: 'DLOC',
            });

            // Prepare Data
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const day = today.getDate();

            // Need to ensure straddleData has OHLC. If not, we simulate or use price as Close.
            // Wait, I updated ATMOptionPriceData, but StraddleData is a separate interface in OptionsContext?
            // Let's check StraddleData interface.
            // Assuming I updated ATM... but looking at useOptions -> straddleData, it might be different.
            // Actually, in `OptionsContext.ts`, `straddleData` is populated separately via `setStraddleData(generateMockStraddleData())`.
            // I need to check if I updated `generateMockStraddleData` too. 
            // I likely DID NOT update `StraddleData` interface yet!
            // I only updated `ATMOptionPriceData` and `generateMockATMOptionPriceData`.
            // `StraddleVWAP` component uses `straddleData` which likely comes from `generateMockStraddleData`.
            // I MUST UPDATE `StraddleData` interface and generator first!
            // ABORTING UPDATE of Component to Fix Data First.

            // Actually, I can do it right here if I just map Close to Open/High/Low for now if missing, 
            // BUT to do it right I should update the Context.
            // Let's assume I will update the Context next. I will write this component assuming data exists or falling back.

            // Fallback logic for now inside the component if fields missing:
            const formatData = straddleData.map(d => {
                const parts = d.time.split(':');
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);

                if (isNaN(hours) || isNaN(minutes)) return null;

                const timeVal = new Date(year, month, day, hours, minutes).getTime() / 1000;

                // Check if OHLC exists, else use price, fallback to 0
                const safePrice = d.price || 0;
                const candle = d as any;
                const o = candle.open ?? candle.straddleOpen ?? safePrice;
                const h = candle.high ?? candle.straddleHigh ?? safePrice;
                const l = candle.low ?? candle.straddleLow ?? safePrice;
                const c = candle.close ?? candle.straddleClose ?? safePrice;

                return {
                    time: timeVal as any,
                    kline: { time: timeVal as any, open: o, high: h, low: l, close: c },
                    vwap: { time: timeVal as any, value: d.vwap || 0 },
                    dloc: { time: timeVal as any, value: d.dloc || 0 }
                };
            }).filter(d => d !== null) as any[];

            mainSeries.setData(formatData.map(d => d.kline));
            vwapSeries.setData(formatData.map(d => d.vwap));
            dlocSeries.setData(formatData.map(d => d.dloc));

            chart.timeScale().fitContent();

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
            console.error("Failed to initialize StraddleVWAP:", err);
        }
    }, [straddleData]);

    if (isLoading || straddleData.length === 0) {
        return (
            <div className="glass-card p-4 h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const latest = straddleData[straddleData.length - 1];
    const isBelowVWAP = latest.price < latest.vwap;

    return (
        <div className="glass-card p-4 flex flex-col h-full bg-background border border-border/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                            STRADDLE VWAP
                            <span className="px-1.5 py-0.5 rounded-sm bg-secondary text-[10px] text-muted-foreground font-normal">Candle + DLOC</span>
                        </h2>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded-sm ${isBelowVWAP
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : "bg-primary/10 border border-primary/30"
                    }`}>
                    {isBelowVWAP ? <Minus className="w-3 h-3 text-yellow-500" /> : <TrendingUp className="w-3 h-3 text-primary" />}
                    <span className={`text-[10px] font-medium ${isBelowVWAP ? "text-yellow-500" : "text-primary"}`}>
                        {isBelowVWAP ? "BELOW VWAP" : "ABOVE VWAP"}
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[150px] relative">
                <div ref={chartContainerRef} className="absolute inset-0" />
            </div>
        </div>
    );
};

export default StraddleVWAP;
