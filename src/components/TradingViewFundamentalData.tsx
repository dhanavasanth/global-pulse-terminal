/**
 * TradingView Fundamental Data Widget
 * Shows company financials and fundamentals
 */

import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";

interface TradingViewFundamentalDataProps {
    symbol?: string;
    colorTheme?: "dark" | "light";
    height?: number;
    isTransparent?: boolean;
}

const TradingViewFundamentalData = ({
    symbol = "NASDAQ:AAPL",
    colorTheme = "dark",
    height = 400,
    isTransparent = false,
}: TradingViewFundamentalDataProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !isExpanded) return;

        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-financials.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            isTransparent,
            largeChartUrl: "",
            displayMode: "regular",
            width: "100%",
            height: "100%",
            colorTheme,
            symbol,
            locale: "en",
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
    }, [symbol, colorTheme, isTransparent, isExpanded]);

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">FUNDAMENTAL DATA</h2>
                        <p className="text-xs text-muted-foreground">{symbol.split(":")[1]} financials</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {isExpanded && (
                <div style={{ height: `${height}px` }} className="w-full">
                    <div
                        ref={containerRef}
                        className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50"
                        style={{ height: "100%", width: "100%" }}
                    />
                </div>
            )}
        </div>
    );
};

export default TradingViewFundamentalData;
