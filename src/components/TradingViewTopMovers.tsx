/**
 * TradingView Top Movers Widget (Gainers & Losers)
 * Shows top gaining, losing, and most active stocks
 */

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

type MoverType = "gainers" | "losers" | "active";

interface TradingViewTopMoversProps {
    colorTheme?: "dark" | "light";
    height?: number;
    exchange?: string;
}

const TradingViewTopMovers = ({
    colorTheme = "dark",
    height = 350,
    exchange = "US",
}: TradingViewTopMoversProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<MoverType>("gainers");

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";

        const tabMapping: Record<MoverType, string> = {
            gainers: "top_gainers",
            losers: "top_losers",
            active: "most_active",
        };

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme,
            dateRange: "1D",
            exchange,
            showChart: true,
            locale: "en",
            largeChartUrl: "",
            isTransparent: false,
            showSymbolLogo: true,
            showFloatingTooltip: true,
            width: "100%",
            height: "100%",
            plotLineColorGrowing: "rgba(41, 98, 255, 1)",
            plotLineColorFalling: "rgba(255, 0, 0, 1)",
            gridLineColor: "rgba(240, 243, 250, 0)",
            scaleFontColor: "rgba(120, 123, 134, 1)",
            belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
            belowLineFillColorFalling: "rgba(255, 0, 0, 0.12)",
            belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
            belowLineFillColorFallingBottom: "rgba(255, 0, 0, 0)",
            symbolActiveColor: "rgba(41, 98, 255, 0.12)",
        });

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";

        containerRef.current.appendChild(widgetContainer);
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [colorTheme, selectedType, exchange]);

    const tabs = [
        { type: "gainers" as MoverType, label: "Gainers", icon: TrendingUp, color: "text-green-500" },
        { type: "losers" as MoverType, label: "Losers", icon: TrendingDown, color: "text-red-500" },
        { type: "active" as MoverType, label: "Active", icon: Activity, color: "text-blue-500" },
    ];

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">TOP MOVERS</h2>
                        <p className="text-xs text-muted-foreground">Gainers, Losers & Most Active</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                    <span className="text-xs text-bullish font-mono">LIVE</span>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-3">
                {tabs.map(({ type, label, icon: Icon, color }) => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedType === type
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        <Icon className={`w-3 h-3 ${selectedType === type ? "" : color}`} />
                        {label}
                    </button>
                ))}
            </div>

            <div style={{ height: `${height}px` }} className="w-full">
                <div
                    ref={containerRef}
                    className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50"
                    style={{ height: "100%", width: "100%" }}
                />
            </div>
        </div>
    );
};

export default TradingViewTopMovers;
