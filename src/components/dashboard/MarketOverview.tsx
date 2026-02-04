import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Types
interface IndexData {
    symbol: string;
    last: number;
    change: number;
    percentChange: number;
    data: { value: number }[]; // Mock history for sparkline
    color: string;
}

const generateSparkline = (start: number, count: number, volatility: number) => {
    let current = start;
    return Array.from({ length: count }, () => {
        current += (Math.random() - 0.5) * volatility;
        return { value: current };
    });
};

export const MarketOverview = () => {
    // Selected 4 Key Indices to match the reference image style
    const indices: IndexData[] = [
        {
            symbol: "S&P 500",
            last: 4185.20, change: -32.50, percentChange: -0.76,
            data: generateSparkline(4200, 20, 15),
            color: "#ef4444"
        },
        {
            symbol: "Nikkei 225",
            last: 32450.00, change: 175.50, percentChange: 0.54,
            data: generateSparkline(32300, 20, 100),
            color: "#22c55e"
        },
        {
            symbol: "GIFT NIFTY",
            last: 21680.00, change: 140.00, percentChange: 0.65,
            data: generateSparkline(21550, 20, 40),
            color: "#22c55e"
        },
        {
            symbol: "USD/INR",
            last: 74.88, change: 0.19, percentChange: 0.25,
            data: generateSparkline(74.7, 20, 0.1),
            color: "#eab308" // Slight positive but neutral color in reference? Let's use green if pos.
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {indices.map((idx) => {
                const isPositive = idx.change >= 0;
                const color = isPositive ? "#22c55e" : "#ef4444";

                return (
                    <div key={idx.symbol} className="glass-card p-4 relative overflow-hidden bg-secondary/10 border-border/50 flex flex-col justify-between">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2 z-10">
                            <h4 className="font-bold text-sm tracking-wide">{idx.symbol}</h4>
                            <span className={`text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{idx.percentChange}%
                            </span>
                        </div>

                        {/* Sparkline */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={idx.data}>
                                    <defs>
                                        <linearGradient id={`grad-${idx.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={color}
                                        strokeWidth={2}
                                        fill={`url(#grad-${idx.symbol})`}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Price (Overlaying chart slightly) */}
                        <div className="z-10 mt-auto">
                            <span className={`text-lg font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {idx.last.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
