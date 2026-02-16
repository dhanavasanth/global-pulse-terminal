import { ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

export const RiskDashboard = () => {
    const { latestCycle } = useAutoTrade();
    const risk = latestCycle?.risk || { score: 0, label: "N/A" };
    const vix = latestCycle?.market_data?.vix ?? 0;

    const riskScore = risk.score || 0;
    const riskLabel = risk.label || "N/A";

    // Risk gauge colors
    const riskColor = riskLabel === "high"
        ? "text-rose-400"
        : riskLabel === "medium"
            ? "text-amber-400"
            : riskLabel === "low"
                ? "text-emerald-400"
                : "text-zinc-400";

    const riskBg = riskLabel === "high"
        ? "bg-rose-500/10 border-rose-500/20"
        : riskLabel === "medium"
            ? "bg-amber-500/10 border-amber-500/20"
            : riskLabel === "low"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-white/5 border-white/10";

    // VIX color
    const vixColor = vix > 25
        ? "text-rose-400"
        : vix > 18
            ? "text-amber-400"
            : "text-emerald-400";

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Risk Dashboard</h3>
            </div>

            {/* Risk Score Ring */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke={riskLabel === "high" ? "#f87171" : riskLabel === "medium" ? "#fbbf24" : "#34d399"}
                            strokeWidth="8"
                            strokeDasharray={`${(riskScore / 100) * 213.6} 213.6`}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-lg font-bold ${riskColor}`}>{riskScore}</span>
                        <span className="text-[8px] text-zinc-500">/100</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className={`rounded-lg border ${riskBg} px-3 py-2`}>
                        <div className="text-[10px] text-zinc-500 uppercase">Risk Level</div>
                        <div className={`text-sm font-bold uppercase ${riskColor}`}>{riskLabel}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                        <div className="text-[10px] text-zinc-500 uppercase">India VIX</div>
                        <div className={`text-sm font-bold ${vixColor}`}>{vix || "—"}</div>
                    </div>
                </div>
            </div>

            {/* Alpha / Beta */}
            <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-cyan-400" />
                        <span className="text-[10px] text-zinc-500 uppercase">Alpha</span>
                    </div>
                    <div className="text-lg font-bold text-cyan-400">
                        +0.02%
                    </div>
                    <div className="text-[9px] text-zinc-600">Excess return</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="h-3 w-3 text-purple-400" />
                        <span className="text-[10px] text-zinc-500 uppercase">Beta</span>
                    </div>
                    <div className="text-lg font-bold text-purple-400">
                        1.08
                    </div>
                    <div className="text-[9px] text-zinc-600">Market sensitivity</div>
                </div>
            </div>
        </div>
    );
};
