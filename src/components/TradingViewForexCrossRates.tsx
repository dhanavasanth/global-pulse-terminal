/**
 * TradingView Forex Cross Rates Widget
 * Shows real-time quotes of currencies in comparison
 */

import { useEffect, useRef, useState } from "react";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";

interface TradingViewForexCrossRatesProps {
    colorTheme?: "dark" | "light";
    height?: number;
    isTransparent?: boolean;
}

const TradingViewForexCrossRates = ({
    colorTheme = "dark",
    height = 350,
    isTransparent = false,
}: TradingViewForexCrossRatesProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !isExpanded) return;

        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            width: "100%",
            height: "100%",
            currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "INR"],
            isTransparent,
            colorTheme,
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
    }, [colorTheme, isTransparent, isExpanded]);

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">FOREX CROSS RATES</h2>
                        <p className="text-xs text-muted-foreground">Real-time currency comparison</p>
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

export default TradingViewForexCrossRates;
