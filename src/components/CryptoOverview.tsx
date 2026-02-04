import { useState, useEffect } from "react";
import { useChart } from "@/contexts/ChartContext";
import {
    Coins, TrendingUp, TrendingDown, Activity,
    Flame, Star, ChevronRight, MousePointer
} from "lucide-react";

interface CryptoAsset {
    rank: number;
    symbol: string;
    tradingViewSymbol: string;
    name: string;
    price: number;
    change24h: number;
    marketCap: string;
    volume24h: string;
    sparkline: number[];
    isHot?: boolean;
}

const cryptoData: CryptoAsset[] = [
    {
        rank: 1, symbol: "BTC", tradingViewSymbol: "BINANCE:BTCUSDT", name: "Bitcoin",
        price: 105420.50, change24h: 4.25, marketCap: "2.1T", volume24h: "48.2B",
        sparkline: [100, 102, 101, 104, 103, 105, 104, 106, 107, 105],
        isHot: true
    },
    {
        rank: 2, symbol: "ETH", tradingViewSymbol: "BINANCE:ETHUSDT", name: "Ethereum",
        price: 3845.80, change24h: 3.12, marketCap: "462B", volume24h: "18.5B",
        sparkline: [100, 99, 101, 102, 101, 103, 104, 103, 105, 106]
    },
    {
        rank: 3, symbol: "SOL", tradingViewSymbol: "BINANCE:SOLUSDT", name: "Solana",
        price: 248.45, change24h: 8.45, marketCap: "108B", volume24h: "8.2B",
        sparkline: [100, 102, 105, 104, 107, 108, 110, 109, 112, 115],
        isHot: true
    },
    {
        rank: 4, symbol: "XRP", tradingViewSymbol: "BINANCE:XRPUSDT", name: "Ripple",
        price: 2.85, change24h: -1.25, marketCap: "142B", volume24h: "5.8B",
        sparkline: [100, 99, 98, 99, 97, 98, 97, 96, 97, 98]
    },
    {
        rank: 5, symbol: "ADA", tradingViewSymbol: "BINANCE:ADAUSDT", name: "Cardano",
        price: 1.12, change24h: 2.35, marketCap: "39B", volume24h: "1.2B",
        sparkline: [100, 101, 100, 102, 103, 102, 103, 104, 103, 105]
    },
];

const MiniSparkline = ({ data, isPositive }: { data: number[], isPositive: boolean }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 60;
        const y = 20 - ((value - min) / range) * 20;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="60" height="24" className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? "#22c55e" : "#ef4444"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const CryptoOverview = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { setSelectedSymbol, setSymbolName, selectedSymbol } = useChart();

    useEffect(() => {
        const interval = setInterval(() => {
            setIsUpdating(true);
            setTimeout(() => setIsUpdating(false), 200);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleSelectCrypto = (crypto: CryptoAsset) => {
        setSelectedSymbol(crypto.tradingViewSymbol);
        setSymbolName(crypto.name);
    };

    const isSelected = (crypto: CryptoAsset) => {
        return selectedSymbol === crypto.tradingViewSymbol;
    };

    const totalMarketCap = "2.85T";
    const totalVolume24h = "125.8B";
    const btcDominance = "52.4%";

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 via-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">CRYPTO OVERVIEW</h2>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MousePointer className="w-3 h-3" /> Click to analyze
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                    <span className={`w-1.5 h-1.5 rounded-full bg-bullish ${isUpdating ? 'animate-ping' : 'animate-pulse'}`} />
                    <span className="text-xs text-bullish font-mono">LIVE</span>
                </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
                    <p className="font-mono font-bold text-sm text-primary">${totalMarketCap}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                    <p className="font-mono font-bold text-sm text-primary">${totalVolume24h}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">BTC Dom</p>
                    <p className="font-mono font-bold text-sm text-amber-400">{btcDominance}</p>
                </div>
            </div>

            {/* Crypto List */}
            <div className="space-y-2">
                {cryptoData.map((crypto) => (
                    <div
                        key={crypto.symbol}
                        onClick={() => handleSelectCrypto(crypto)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group ${isSelected(crypto)
                                ? "bg-primary/20 border border-primary/40 shadow-lg shadow-primary/10"
                                : "bg-secondary/20 hover:bg-secondary/40"
                            }`}
                    >
                        {/* Rank */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${crypto.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                                crypto.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                                    crypto.rank === 3 ? "bg-orange-600/20 text-orange-400" :
                                        "bg-secondary/50 text-muted-foreground"
                            }`}>
                            {crypto.rank}
                        </div>

                        {/* Symbol & Name */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm transition-colors ${isSelected(crypto) ? "text-primary" : "group-hover:text-primary"
                                    }`}>
                                    {crypto.symbol}
                                </span>
                                {crypto.isHot && (
                                    <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                )}
                                {isSelected(crypto) && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/30 text-primary font-medium">
                                        VIEWING
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">{crypto.name}</span>
                        </div>

                        {/* Sparkline */}
                        <div className="hidden sm:block">
                            <MiniSparkline data={crypto.sparkline} isPositive={crypto.change24h >= 0} />
                        </div>

                        {/* Price & Change */}
                        <div className="text-right min-w-[80px]">
                            <div className="font-mono font-medium text-sm">
                                ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`font-mono text-xs flex items-center justify-end gap-1 ${crypto.change24h >= 0 ? "text-bullish" : "text-bearish"
                                }`}>
                                {crypto.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {crypto.change24h >= 0 ? "+" : ""}{crypto.change24h.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All */}
            <button className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded-lg hover:border-primary/30 hover:bg-primary/5 flex items-center justify-center gap-1">
                View All Cryptocurrencies <ChevronRight className="w-3 h-3" />
            </button>
        </div>
    );
};

export default CryptoOverview;
