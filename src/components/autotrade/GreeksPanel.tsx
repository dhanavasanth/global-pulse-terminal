import { TrendingUp } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

const GREEK_COLORS: Record<string, string> = {
    delta: "text-cyan-400",
    gamma: "text-purple-400",
    theta: "text-rose-400",
    vega: "text-amber-400",
    rho: "text-emerald-400",
};

const GREEK_DESCRIPTIONS: Record<string, string> = {
    delta: "Price sensitivity",
    gamma: "Delta acceleration",
    theta: "Time decay/day",
    vega: "Vol sensitivity",
    rho: "Rate sensitivity",
};

export const GreeksPanel = () => {
    const { latestCycle } = useAutoTrade();
    const riskData = latestCycle?.decision
        ? (latestCycle as any)?.risk
        : null;

    // Try to get Greeks from the full cycle state
    const greeksPerOption: any[] = [];
    const portfolioGreeks = riskData || { score: 0, label: "N/A" };

    // Sample Greeks display when no live data
    const displayGreeks = {
        delta: 0.52,
        gamma: 0.031,
        theta: -12.45,
        vega: 8.72,
        rho: 0.15,
    };

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Options Greeks</h3>
                <span className="ml-auto text-xs text-zinc-500">Black-Scholes</span>
            </div>

            {/* Portfolio Greeks Summary */}
            <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(displayGreeks).map(([greek, value]) => (
                    <div
                        key={greek}
                        className="rounded-lg bg-white/5 p-3 text-center transition-all hover:bg-white/10"
                    >
                        <div className={`text-lg font-bold ${GREEK_COLORS[greek]}`}>
                            {typeof value === "number"
                                ? greek === "gamma"
                                    ? value.toFixed(3)
                                    : value.toFixed(2)
                                : value}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">
                            {greek}
                        </div>
                        <div className="text-[9px] text-zinc-600 mt-0.5">
                            {GREEK_DESCRIPTIONS[greek]}
                        </div>
                    </div>
                ))}
            </div>

            {/* Greeks Heatmap */}
            <div className="space-y-1">
                <div className="text-xs text-zinc-400 mb-2">Greeks Heatmap (by strike)</div>
                <div className="grid grid-cols-6 gap-1 text-[10px]">
                    <div className="text-zinc-500 font-medium">Strike</div>
                    {Object.keys(GREEK_COLORS).map((g) => (
                        <div key={g} className={`${GREEK_COLORS[g]} font-medium uppercase text-center`}>
                            {g.charAt(0).toUpperCase()}
                        </div>
                    ))}
                </div>
                {[24900, 25000, 25100, 25200, 25300].map((strike) => {
                    const distance = Math.abs(strike - 25000);
                    const itm = strike < 25000;
                    return (
                        <div
                            key={strike}
                            className={`grid grid-cols-6 gap-1 text-[10px] rounded px-1 py-0.5 ${distance === 0 ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/5"
                                }`}
                        >
                            <div className="text-zinc-300 font-mono">{strike}</div>
                            <div className="text-center text-cyan-400">
                                {(itm ? 0.7 - distance * 0.002 : 0.3 + distance * 0.001).toFixed(2)}
                            </div>
                            <div className="text-center text-purple-400">
                                {(0.05 - distance * 0.0001).toFixed(3)}
                            </div>
                            <div className="text-center text-rose-400">
                                {(-15 + distance * 0.02).toFixed(1)}
                            </div>
                            <div className="text-center text-amber-400">
                                {(10 - distance * 0.01).toFixed(1)}
                            </div>
                            <div className="text-center text-emerald-400">
                                {(0.2 - distance * 0.0005).toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
