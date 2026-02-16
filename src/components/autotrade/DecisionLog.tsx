import { Bot, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

export const DecisionLog = () => {
    const { latestCycle, cycleHistory } = useAutoTrade();

    const getActionIcon = (action: string) => {
        switch (action?.toUpperCase()) {
            case "BUY": return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />;
            case "SELL": return <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />;
            case "HOLD": return <Minus className="h-3.5 w-3.5 text-zinc-400" />;
            case "HEDGE": return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
            default: return <Bot className="h-3.5 w-3.5 text-cyan-400" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action?.toUpperCase()) {
            case "BUY": return "border-emerald-500/20 bg-emerald-500/5";
            case "SELL": return "border-rose-500/20 bg-rose-500/5";
            case "HEDGE": return "border-amber-500/20 bg-amber-500/5";
            default: return "border-white/10 bg-white/5";
        }
    };

    // Collect decisions from all cycles
    const allDecisions = cycleHistory.length > 0
        ? cycleHistory.slice(0, 10).map((cycle) => ({
            cycle_id: cycle.cycle_id,
            timestamp: cycle.timestamp,
            primary: cycle.decision?.primary_action || (cycle.decision as any)?.primary || {},
            confidence: cycle.decision?.confidence || 0,
            market_regime: cycle.decision?.market_regime || "unknown",
        }))
        : [
            {
                cycle_id: "sample_1",
                timestamp: new Date().toISOString(),
                primary: { action: "BUY", type: "CALL", strike: 25000, reason: "Bullish alignment + high OI buildup" },
                confidence: 0.72,
                market_regime: "normal",
            },
            {
                cycle_id: "sample_2",
                timestamp: new Date(Date.now() - 300000).toISOString(),
                primary: { action: "HOLD", reason: "Signals not aligned, VIX elevated" },
                confidence: 0.35,
                market_regime: "moderate_volatility",
            },
        ];

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <Bot className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">AI Decisions</h3>
                <span className="ml-auto text-[10px] text-zinc-500">
                    {allDecisions.length} entries
                </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {allDecisions.map((d, i) => {
                    const action = d.primary?.action || "WAIT";
                    const confPct = Math.round((d.confidence || 0) * 100);
                    const confColor = confPct >= 70 ? "text-emerald-400" : confPct >= 50 ? "text-amber-400" : "text-zinc-400";

                    return (
                        <div
                            key={d.cycle_id || i}
                            className={`rounded-lg border ${getActionColor(action)} p-3 transition-all hover:scale-[1.01]`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {getActionIcon(action)}
                                <span className="text-xs font-bold text-white uppercase">{action}</span>
                                {d.primary?.type && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                                        {d.primary.type}
                                    </span>
                                )}
                                {d.primary?.strike && (
                                    <span className="text-[10px] font-mono text-zinc-400">
                                        @{d.primary.strike}
                                    </span>
                                )}
                                <div className="ml-auto flex items-center gap-1">
                                    <span className={`text-xs font-bold ${confColor}`}>{confPct}%</span>
                                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${confPct >= 70 ? "bg-emerald-400" : confPct >= 50 ? "bg-amber-400" : "bg-zinc-500"
                                                }`}
                                            style={{ width: `${confPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {d.primary?.reason || "No reason provided"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-zinc-600">
                                <span>{new Date(d.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>•</span>
                                <span className="capitalize">{d.market_regime?.replace("_", " ")}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Disclaimer */}
            <div className="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2">
                <p className="text-[9px] text-amber-500/70 leading-relaxed">
                    ⚠️ AI-generated analysis for educational purposes only. Not financial advice. Paper trading only.
                </p>
            </div>
        </div>
    );
};
