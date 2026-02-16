/**
 * TradingView Market Overview Widget
 * Shows global market performance across indices, forex, and futures
 */

import { useEffect, useRef, useState } from "react";
import { Globe, ChevronDown, ChevronUp } from "lucide-react";

type MarketTab = "indices" | "forex" | "futures" | "bonds";

interface TradingViewMarketOverviewProps {
    colorTheme?: "dark" | "light";
    height?: number;
    isTransparent?: boolean;
}

const TradingViewMarketOverview = ({
    colorTheme = "dark",
    height = 400,
    isTransparent = false,
}: TradingViewMarketOverviewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedTab, setSelectedTab] = useState<MarketTab>("indices");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !isExpanded) return;

        containerRef.current.innerHTML = "";

        const tabConfigs: Record<MarketTab, object> = {
            indices: {
                tabs: [
                    {
                        title: "Indices",
                        symbols: [
                            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
                            { s: "FOREXCOM:NSXUSD", d: "NASDAQ 100" },
                            { s: "FOREXCOM:DJI", d: "Dow 30" },
                            { s: "INDEX:NKY", d: "Nikkei 225" },
                            { s: "INDEX:DEU40", d: "DAX Index" },
                            { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
                            { s: "NSE:NIFTY", d: "NIFTY 50" },
                            { s: "NSE:BANKNIFTY", d: "Bank NIFTY" },
                        ],
                    },
                ],
            },
            forex: {
                tabs: [
                    {
                        title: "Forex",
                        symbols: [
                            { s: "FX:EURUSD", d: "EUR/USD" },
                            { s: "FX:GBPUSD", d: "GBP/USD" },
                            { s: "FX:USDJPY", d: "USD/JPY" },
                            { s: "FX:USDCHF", d: "USD/CHF" },
                            { s: "FX:AUDUSD", d: "AUD/USD" },
                            { s: "FX:USDCAD", d: "USD/CAD" },
                            { s: "FX:USDINR", d: "USD/INR" },
                        ],
                    },
                ],
            },
            futures: {
                tabs: [
                    {
                        title: "Futures",
                        symbols: [
                            { s: "COMEX:GC1!", d: "Gold" },
                            { s: "COMEX:SI1!", d: "Silver" },
                            { s: "NYMEX:CL1!", d: "Crude Oil" },
                            { s: "NYMEX:NG1!", d: "Natural Gas" },
                            { s: "CBOT:ZC1!", d: "Corn" },
                            { s: "CBOT:ZW1!", d: "Wheat" },
                        ],
                    },
                ],
            },
            bonds: {
                tabs: [
                    {
                        title: "Bonds",
                        symbols: [
                            { s: "TVC:US10Y", d: "US 10Y Yield" },
                            { s: "TVC:US02Y", d: "US 2Y Yield" },
                            { s: "TVC:DE10Y", d: "Germany 10Y" },
                            { s: "TVC:GB10Y", d: "UK 10Y" },
                            { s: "TVC:JP10Y", d: "Japan 10Y" },
                        ],
                    },
                ],
            },
        };

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme,
            dateRange: "1D",
            showChart: true,
            locale: "en",
            largeChartUrl: "",
            isTransparent,
            showSymbolLogo: true,
            showFloatingTooltip: false,
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
            ...tabConfigs[selectedTab],
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
    }, [colorTheme, isTransparent, selectedTab, isExpanded]);

    const tabs: { type: MarketTab; label: string }[] = [
        { type: "indices", label: "Indices" },
        { type: "forex", label: "Forex" },
        { type: "futures", label: "Commodities" },
        { type: "bonds", label: "Bonds" },
    ];

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">GLOBAL MARKETS</h2>
                        <p className="text-xs text-muted-foreground">Real-time market overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                        <span className="text-xs text-bullish font-mono">LIVE</span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-3">
                {tabs.map(({ type, label }) => (
                    <button
                        key={type}
                        onClick={() => setSelectedTab(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTab === type
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            }`}
                    >
                        {label}
                    </button>
                ))}
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

export default TradingViewMarketOverview;
