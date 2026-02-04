import { useEffect, useRef, useState } from "react";
import { LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";

type HeatmapType = "stocks" | "crypto" | "etf" | "forex";

interface HeatmapConfig {
    dataSource: string;
    blockSize: string;
    grouping: string;
    title: string;
}

const heatmapConfigs: Record<HeatmapType, HeatmapConfig> = {
    stocks: {
        dataSource: "SPX500",
        blockSize: "market_cap_basic",
        grouping: "sector",
        title: "S&P 500 Stocks",
    },
    crypto: {
        dataSource: "Crypto",
        blockSize: "market_cap_calc",
        grouping: "no_group",
        title: "Cryptocurrency",
    },
    etf: {
        dataSource: "AllUSEtf",
        blockSize: "market_cap_basic",
        grouping: "asset_class",
        title: "US ETFs",
    },
    forex: {
        dataSource: "Forex",
        blockSize: "change",
        grouping: "no_group",
        title: "Forex Pairs",
    },
};

const TradingViewHeatmap = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<HeatmapType>("stocks");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !isExpanded) return;

        // Clear any existing content
        containerRef.current.innerHTML = "";

        const config = heatmapConfigs[selectedType];

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: config.dataSource,
            grouping: config.grouping,
            blockSize: config.blockSize,
            blockColor: "change",
            locale: "en",
            symbolUrl: "",
            colorTheme: "dark",
            hasTopBar: true,
            isDataSetEnabled: true,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            width: "100%",
            height: "100%",
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
    }, [selectedType, isExpanded]);

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">MARKET HEATMAP</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Visualize market movements at a glance
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                        <span className="text-xs text-bullish font-mono">LIVE</span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Type selector tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {(Object.keys(heatmapConfigs) as HeatmapType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedType === type
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                    >
                        {heatmapConfigs[type].title}
                    </button>
                ))}
            </div>

            {isExpanded && (
                <div style={{ height: "500px" }} className="w-full">
                    <div
                        ref={containerRef}
                        className="tradingview-widget-container rounded-xl overflow-hidden border border-border/50"
                        style={{ height: "100%", width: "100%" }}
                    />
                </div>
            )}
        </div>
    );
};

export default TradingViewHeatmap;
