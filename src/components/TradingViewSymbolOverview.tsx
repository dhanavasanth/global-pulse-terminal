/**
 * TradingView Symbol Overview Widget
 * Shows latest quotes with a simple chart
 */

import { useEffect, useRef } from "react";

interface TradingViewSymbolOverviewProps {
    symbols?: Array<[string, string]>;
    colorTheme?: "dark" | "light";
    height?: number;
    isTransparent?: boolean;
}

const defaultSymbols: Array<[string, string]> = [
    ["Apple", "NASDAQ:AAPL|1D"],
    ["Google", "NASDAQ:GOOGL|1D"],
    ["Microsoft", "NASDAQ:MSFT|1D"],
    ["Tesla", "NASDAQ:TSLA|1D"],
];

const TradingViewSymbolOverview = ({
    symbols = defaultSymbols,
    colorTheme = "dark",
    height = 400,
    isTransparent = false,
}: TradingViewSymbolOverviewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbols,
            chartOnly: false,
            width: "100%",
            height: "100%",
            locale: "en",
            colorTheme,
            autosize: true,
            showVolume: false,
            showMA: false,
            hideDateRanges: false,
            hideMarketStatus: false,
            hideSymbolLogo: false,
            scalePosition: "right",
            scaleMode: "Normal",
            fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
            fontSize: "10",
            noTimeScale: false,
            valuesTracking: "1",
            changeMode: "price-and-percent",
            chartType: "area",
            lineWidth: 2,
            lineType: 0,
            dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
            isTransparent,
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
    }, [symbols, colorTheme, isTransparent]);

    return (
        <div style={{ height: `${height}px` }} className="w-full">
            <div
                ref={containerRef}
                className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50"
                style={{ height: "100%", width: "100%" }}
            />
        </div>
    );
};

export default TradingViewSymbolOverview;
