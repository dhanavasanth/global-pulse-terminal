/**
 * TradingView Ticker Tape Widget
 * Scrolling ticker showing market data
 */

import { useEffect, useRef } from "react";

interface TradingViewTickerTapeProps {
    colorTheme?: "dark" | "light";
    isTransparent?: boolean;
    displayMode?: "adaptive" | "regular" | "compact";
    symbols?: Array<{ proName: string; title: string }>;
}

const defaultSymbols = [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "FOREXCOM:NSXUSD", title: "NASDAQ 100" },
    { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
    { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
    { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
    { proName: "COMEX:GC1!", title: "Gold" },
    { proName: "NYMEX:CL1!", title: "Crude Oil" },
    { proName: "NSE:NIFTY", title: "NIFTY 50" },
    { proName: "NSE:BANKNIFTY", title: "Bank NIFTY" },
    { proName: "TVC:DXY", title: "Dollar Index" },
];

const TradingViewTickerTape = ({
    colorTheme = "dark",
    isTransparent = true,
    displayMode = "regular",
    symbols = defaultSymbols,
}: TradingViewTickerTapeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbols,
            showSymbolLogo: true,
            colorTheme,
            isTransparent,
            displayMode,
            locale: "en",
        });

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";

        containerRef.current.appendChild(widgetContainer);
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [colorTheme, isTransparent, displayMode, symbols]);

    return (
        <div
            ref={containerRef}
            className="tradingview-widget-container w-full"
        />
    );
};

export default TradingViewTickerTape;
