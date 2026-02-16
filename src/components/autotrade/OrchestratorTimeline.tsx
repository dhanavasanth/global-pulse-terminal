import { Workflow, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

const STAGES = [
    { key: "data_fetcher", label: "Fetch", icon: "📊", agents: ["data_fetcher"] },
    { key: "parallel", label: "Analyze", icon: "🔄", agents: ["sentiment", "technical", "risk_metrics", "active_trades"] },
    { key: "decision_maker", label: "Decide", icon: "🎯", agents: ["decision_maker"] },
    { key: "monitor", label: "Monitor", icon: "👁️", agents: ["monitor"] },
];

export const OrchestratorTimeline = () => {
    const { latestCycle, status } = useAutoTrade();
    const completed = latestCycle?.agents_completed || [];
    const isRunning = status?.running;

    const getStageStatus = (stage: typeof STAGES[0]) => {
        const allDone = stage.agents.every((a) => completed.includes(a));
        const anyDone = stage.agents.some((a) => completed.includes(a));
        if (allDone) return "done";
        if (anyDone || (isRunning && !allDone)) return "running";
        return "pending";
    };

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <Workflow className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Orchestrator Pipeline</h3>
                {latestCycle?.cycle_id && (
                    <span className="ml-auto text-[10px] font-mono text-zinc-500">
                        #{latestCycle.cycle_id}
                    </span>
                )}
            </div>

            {/* DAG Timeline */}
            <div className="flex items-center justify-between gap-1">
                {STAGES.map((stage, i) => {
                    const stageStatus = getStageStatus(stage);

                    const bgColor = stageStatus === "done"
                        ? "bg-emerald-500/15 border-emerald-500/30"
                        : stageStatus === "running"
                            ? "bg-cyan-500/15 border-cyan-500/30"
                            : "bg-white/5 border-white/10";

                    const textColor = stageStatus === "done"
                        ? "text-emerald-400"
                        : stageStatus === "running"
                            ? "text-cyan-400"
                            : "text-zinc-500";

                    return (
                        <div key={stage.key} className="flex items-center flex-1">
                            <div className={`flex-1 rounded-lg border ${bgColor} p-2 text-center transition-all duration-500`}>
                                <div className="text-lg mb-0.5">{stage.icon}</div>
                                <div className={`text-[10px] font-semibold ${textColor}`}>{stage.label}</div>
                                <div className="mt-1">
                                    {stageStatus === "done" ? (
                                        <CheckCircle2 className="h-3 w-3 text-emerald-400 mx-auto" />
                                    ) : stageStatus === "running" ? (
                                        <Loader2 className="h-3 w-3 text-cyan-400 mx-auto animate-spin" />
                                    ) : (
                                        <div className="h-3 w-3 rounded-full border border-zinc-600 mx-auto" />
                                    )}
                                </div>
                                {stage.key === "parallel" && (
                                    <div className="text-[8px] text-zinc-600 mt-0.5">
                                        {stage.agents.filter(a => completed.includes(a)).length}/{stage.agents.length}
                                    </div>
                                )}
                            </div>
                            {i < STAGES.length - 1 && (
                                <ArrowRight className={`h-3 w-3 mx-0.5 flex-shrink-0 ${getStageStatus(STAGES[i + 1]) !== "pending" ? "text-cyan-400" : "text-zinc-700"
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cycle Timing */}
            {latestCycle && (
                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>
                        {new Date(latestCycle.timestamp).toLocaleTimeString("en-IN")}
                    </span>
                    <span>
                        {completed.length}/{STAGES.reduce((acc, s) => acc + s.agents.length, 0)} agents
                    </span>
                    <span>
                        {latestCycle.duration_ms?.toFixed(0)}ms total
                    </span>
                </div>
            )}
        </div>
    );
};
