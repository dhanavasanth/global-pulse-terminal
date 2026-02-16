import { Activity, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

const AGENT_DISPLAY_NAMES: Record<string, { label: string; icon: string }> = {
    data_fetcher: { label: "Data Fetcher", icon: "📊" },
    sentiment: { label: "Sentiment Analyzer", icon: "💭" },
    technical: { label: "Technical Analyzer", icon: "📈" },
    risk_metrics: { label: "Risk Metrics", icon: "⚠️" },
    active_trades: { label: "Active Trades", icon: "🔥" },
    decision_maker: { label: "Decision Maker", icon: "🎯" },
    monitor: { label: "Monitor", icon: "👁️" },
};

const ALL_AGENTS = Object.keys(AGENT_DISPLAY_NAMES);

export const AgentStatusPanel = () => {
    const { latestCycle, status } = useAutoTrade();
    const completed = latestCycle?.agents_completed || [];
    const errors = latestCycle?.errors || [];
    const errorAgents = errors.map((e: any) => e.agent);
    const isRunning = status?.running;

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Agent Pipeline</h3>
                {isRunning && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2">
                {ALL_AGENTS.map((agent) => {
                    const info = AGENT_DISPLAY_NAMES[agent];
                    const isDone = completed.includes(agent);
                    const hasError = errorAgents.includes(agent);

                    let statusColor = "text-zinc-500";
                    let StatusIcon = Clock;
                    let bg = "bg-white/5";

                    if (hasError) {
                        statusColor = "text-red-400";
                        StatusIcon = XCircle;
                        bg = "bg-red-500/10";
                    } else if (isDone) {
                        statusColor = "text-emerald-400";
                        StatusIcon = CheckCircle2;
                        bg = "bg-emerald-500/10";
                    } else if (isRunning && !isDone) {
                        statusColor = "text-amber-400";
                        StatusIcon = Loader2;
                        bg = "bg-amber-500/10";
                    }

                    return (
                        <div
                            key={agent}
                            className={`flex items-center gap-3 rounded-lg ${bg} px-3 py-2 transition-all duration-300`}
                        >
                            <span className="text-base">{info.icon}</span>
                            <span className="text-xs font-medium text-white/80 flex-1">{info.label}</span>
                            <StatusIcon
                                className={`h-3.5 w-3.5 ${statusColor} ${isRunning && !isDone && !hasError ? "animate-spin" : ""
                                    }`}
                            />
                        </div>
                    );
                })}
            </div>

            {latestCycle && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-xs text-zinc-400">
                        <span>Cycle #{latestCycle.cycle_number}</span>
                        <span>{latestCycle.duration_ms?.toFixed(0)}ms</span>
                    </div>
                </div>
            )}
        </div>
    );
};
