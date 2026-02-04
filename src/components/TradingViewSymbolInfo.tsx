import { useEffect, useRef } from "react";
import { useChart } from "@/contexts/ChartContext";
import { Info } from "lucide-react";

const TradingViewSymbolInfo = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { selectedSymbol, symbolName } = useChart();

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol: selectedSymbol,
            width: "100%",
            locale: "en",
            colorTheme: "dark",
            isTransparent: false,
        });

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.width = "100%";

        containerRef.current.appendChild(widgetContainer);
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [selectedSymbol]);

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">SYMBOL INFO</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {symbolName} Details
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div
                    ref={containerRef}
                    className="tradingview-widget-container rounded-xl overflow-hidden border border-border/50"
                    style={{ width: "100%" }}
                />
            </div>
        </div>
    );
};

export default TradingViewSymbolInfo;
