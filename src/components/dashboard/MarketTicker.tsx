import { TrendingUp, TrendingDown } from "lucide-react";

export const MarketTicker = () => {
    const items = [
        { symbol: "SGX NIFTY", value: 21850.5, change: 0.45 },
        { symbol: "US 10Y BOND", value: 4.15, change: -0.02 },
        { symbol: "BITCOIN", value: 48500, change: 2.10 },
        { symbol: "GOLD", value: 2030.50, change: 0.15 },
        { symbol: "USD/JPY", value: 149.50, change: 0.20 },
        { symbol: "NIKKEI", value: 37500, change: 1.15 },
        { symbol: "HANG SENG", value: 16200, change: -0.85 },
    ];

    return (
        <div className="w-full overflow-hidden bg-background text-xs font-mono border-b border-border/50 h-8 flex items-center">
            <div className="animate-ticker flex items-center gap-8 px-4 whitespace-nowrap" style={{ animation: 'ticker 30s linear infinite' }}>
                {/* Duplicate items for seamless loop */}
                {[...items, ...items, ...items].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-muted-foreground font-semibold">{item.symbol}</span>
                        <span className={item.change >= 0 ? "text-green-500" : "text-red-500"}>
                            {item.value.toLocaleString()}
                        </span>
                        <span className={`flex items-center text-[10px] ${item.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change)}%
                        </span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};
