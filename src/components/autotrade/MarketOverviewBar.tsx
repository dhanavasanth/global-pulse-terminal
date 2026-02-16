import { BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

export const MarketOverviewBar = () => {
    const { latestCycle } = useAutoTrade();
    const ltp = latestCycle?.market_data?.ltp || {};
    const vix = latestCycle?.market_data?.vix ?? 0;

    const indices = [
        { key: "nifty50", label: "NIFTY 50", value: ltp.nifty50 || 25000, change: 0.42 },
        { key: "sensex", label: "SENSEX", value: ltp.sensex || 82000, change: 0.38 },
        { key: "banknifty", label: "BANK NIFTY", value: ltp.banknifty || 53000, change: -0.15 },
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-3">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-zinc-400">LIVE</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {indices.map((idx) => (
                    <div key={idx.key} className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-medium">{idx.label}</span>
                        <span className="text-sm font-bold text-white font-mono">
                            {idx.value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                        <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${idx.change > 0 ? "text-emerald-400" : idx.change < 0 ? "text-rose-400" : "text-zinc-400"
                            }`}>
                            {idx.change > 0 ? <ArrowUp className="h-2.5 w-2.5" /> :
                                idx.change < 0 ? <ArrowDown className="h-2.5 w-2.5" /> :
                                    <Minus className="h-2.5 w-2.5" />}
                            {Math.abs(idx.change).toFixed(2)}%
                        </span>
                    </div>
                ))}

                <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5">
                    <span className="text-[10px] text-zinc-500 font-medium">VIX</span>
                    <span className={`text-sm font-bold font-mono ${vix > 25 ? "text-rose-400" : vix > 18 ? "text-amber-400" : "text-emerald-400"
                        }`}>
                        {vix || "15.2"}
                    </span>
                </div>
            </div>
        </div>
    );
};
