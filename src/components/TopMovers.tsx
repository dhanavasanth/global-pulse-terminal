import { useState, useEffect } from "react";
import { useChart } from "@/contexts/ChartContext";
import {
    Award, TrendingUp, TrendingDown, Flame,
    BarChart3, Activity, Zap, Star, MousePointer
} from "lucide-react";

interface TopMover {
    symbol: string;
    exchange: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: string;
    isHot?: boolean;
}

type TabType = "gainers" | "losers" | "active";

const TopMovers = () => {
    const [activeTab, setActiveTab] = useState<TabType>("gainers");
    const { setSelectedSymbol, setSymbolName, selectedSymbol } = useChart();

    const gainers: TopMover[] = [
        { symbol: "NVDA", exchange: "NASDAQ", name: "NVIDIA Corp", price: 892.45, change: 67.32, changePercent: 8.16, volume: "42.5M", isHot: true },
        { symbol: "TSLA", exchange: "NASDAQ", name: "Tesla Inc", price: 412.80, change: 28.45, changePercent: 7.40, volume: "38.2M" },
        { symbol: "AMD", exchange: "NASDAQ", name: "AMD Inc", price: 178.92, change: 11.23, changePercent: 6.70, volume: "28.1M" },
        { symbol: "SMCI", exchange: "NASDAQ", name: "Super Micro", price: 892.15, change: 52.40, changePercent: 6.24, volume: "12.4M", isHot: true },
        { symbol: "META", exchange: "NASDAQ", name: "Meta Platforms", price: 512.33, change: 28.87, changePercent: 5.97, volume: "18.9M" },
    ];

    const losers: TopMover[] = [
        { symbol: "INTC", exchange: "NASDAQ", name: "Intel Corp", price: 42.15, change: -3.82, changePercent: -8.31, volume: "52.1M" },
        { symbol: "PFE", exchange: "NYSE", name: "Pfizer Inc", price: 28.45, change: -2.12, changePercent: -6.94, volume: "45.8M" },
        { symbol: "BA", exchange: "NYSE", name: "Boeing Co", price: 198.32, change: -12.45, changePercent: -5.91, volume: "15.2M" },
        { symbol: "NKE", exchange: "NYSE", name: "Nike Inc", price: 98.76, change: -5.23, changePercent: -5.03, volume: "12.8M" },
        { symbol: "DIS", exchange: "NYSE", name: "Walt Disney", price: 112.45, change: -5.12, changePercent: -4.36, volume: "18.4M" },
    ];

    const mostActive: TopMover[] = [
        { symbol: "AAPL", exchange: "NASDAQ", name: "Apple Inc", price: 198.45, change: 2.34, changePercent: 1.19, volume: "89.2M", isHot: true },
        { symbol: "AMZN", exchange: "NASDAQ", name: "Amazon", price: 185.67, change: 3.21, changePercent: 1.76, volume: "67.4M" },
        { symbol: "MSFT", exchange: "NASDAQ", name: "Microsoft", price: 412.89, change: 5.67, changePercent: 1.39, volume: "54.8M" },
        { symbol: "GOOGL", exchange: "NASDAQ", name: "Alphabet", price: 178.45, change: -1.23, changePercent: -0.68, volume: "48.2M" },
        { symbol: "SPY", exchange: "AMEX", name: "S&P 500 ETF", price: 512.34, change: 4.56, changePercent: 0.90, volume: "92.1M", isHot: true },
    ];

    const getMovers = () => {
        switch (activeTab) {
            case "gainers": return gainers;
            case "losers": return losers;
            case "active": return mostActive;
        }
    };

    const tabs = [
        { id: "gainers" as TabType, label: "Top Gainers", icon: TrendingUp, color: "text-bullish" },
        { id: "losers" as TabType, label: "Top Losers", icon: TrendingDown, color: "text-bearish" },
        { id: "active" as TabType, label: "Most Active", icon: Activity, color: "text-primary" },
    ];

    const handleSelectSymbol = (mover: TopMover) => {
        setSelectedSymbol(`${mover.exchange}:${mover.symbol}`);
        setSymbolName(mover.name);
    };

    const isSelected = (mover: TopMover) => {
        return selectedSymbol === `${mover.exchange}:${mover.symbol}`;
    };

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bullish/20 to-bearish/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">TOP MOVERS</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MousePointer className="w-3 h-3" /> Click to analyze
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                    <span className="text-xs text-bullish font-mono">LIVE</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                ? `bg-primary/20 text-primary border border-primary/30`
                                : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                            }`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.color : ""}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Movers List */}
            <div className="space-y-2">
                {getMovers().map((mover, index) => (
                    <div
                        key={mover.symbol}
                        onClick={() => handleSelectSymbol(mover)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group ${isSelected(mover)
                                ? "bg-primary/20 border border-primary/40 shadow-lg shadow-primary/10"
                                : "bg-secondary/20 hover:bg-secondary/40"
                            }`}
                    >
                        {/* Rank */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                index === 1 ? "bg-gray-400/20 text-gray-400" :
                                    index === 2 ? "bg-orange-600/20 text-orange-400" :
                                        "bg-secondary/50 text-muted-foreground"
                            }`}>
                            {index + 1}
                        </div>

                        {/* Symbol & Name */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm transition-colors ${isSelected(mover) ? "text-primary" : "group-hover:text-primary"
                                    }`}>
                                    {mover.symbol}
                                </span>
                                {mover.isHot && (
                                    <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                )}
                                {isSelected(mover) && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/30 text-primary font-medium">
                                        VIEWING
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate block">{mover.name}</span>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                            <div className="font-mono font-medium text-sm">${mover.price.toFixed(2)}</div>
                            <div className={`font-mono text-xs ${mover.change >= 0 ? "text-bullish" : "text-bearish"}`}>
                                {mover.change >= 0 ? "+" : ""}{mover.changePercent.toFixed(2)}%
                            </div>
                        </div>

                        {/* Volume */}
                        <div className="hidden sm:block text-right">
                            <div className="text-xs text-muted-foreground">Vol</div>
                            <div className="font-mono text-xs text-muted-foreground">{mover.volume}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All */}
            <button className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded-lg hover:border-primary/30 hover:bg-primary/5">
                View All Movers →
            </button>
        </div>
    );
};

export default TopMovers;
