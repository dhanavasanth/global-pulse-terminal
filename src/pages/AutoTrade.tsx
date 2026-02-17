import { useState } from "react";
import {
    Play,
    Square,
    RefreshCw,
    Zap,
    Wifi,
    WifiOff,
    Clock,
    Settings,
} from "lucide-react";
import { AutoTradeProvider, useAutoTrade } from "@/contexts/AutoTradeContext";
import { AgentStatusPanel } from "@/components/autotrade/AgentStatusPanel";
import { GreeksPanel } from "@/components/autotrade/GreeksPanel";
import { ActiveTradesPanel } from "@/components/autotrade/ActiveTradesPanel";
import { SentimentGauge } from "@/components/autotrade/SentimentGauge";
import { RiskDashboard } from "@/components/autotrade/RiskDashboard";
import { DecisionLog } from "@/components/autotrade/DecisionLog";
import { OrchestratorTimeline } from "@/components/autotrade/OrchestratorTimeline";
import { MarketOverviewBar } from "@/components/autotrade/MarketOverviewBar";
import MainLayout from "@/components/MainLayout";

const AutoTradeHeader = () => {
    const { status, isConnected, isLoading, error, start, stop, runCycle } = useAutoTrade();
    const [interval, setInterval] = useState(5);
    const [showSettings, setShowSettings] = useState(false);

    const isRunning = status?.running;
    const ollamaOk = status?.ollama_available;

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-xl">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                AutoTrade AI Hub
                            </h1>
                            <p className="text-[10px] text-zinc-500">Multi-Agent Autonomous Analysis</p>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${isConnected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isConnected ? "Connected" : "Disconnected"}
                    </div>

                    {/* Ollama Status */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${ollamaOk
                        ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                        }`}>
                        🤖 {ollamaOk ? `Llama3.1 (${status?.ollama_model})` : "Ollama Offline"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Market Hours */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Clock className="h-3 w-3" />
                        {status?.in_market_hours ? (
                            <span className="text-emerald-400">Market Open</span>
                        ) : (
                            <span>After Hours</span>
                        )}
                    </div>

                    {/* Cycle Counter */}
                    <div className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-zinc-400">
                        {status?.cycle_count ?? 0} cycles
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <Settings className="h-4 w-4 text-zinc-400" />
                    </button>

                    {/* Control Buttons */}
                    <button
                        onClick={() => runCycle()}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        Run Cycle
                    </button>

                    {isRunning ? (
                        <button
                            onClick={() => stop()}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/30 transition-all disabled:opacity-50"
                        >
                            <Square className="h-3.5 w-3.5" />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => start(interval)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            <Play className="h-3.5 w-3.5" />
                            Start ({interval}m)
                        </button>
                    )}
                </div>
            </div>

            {/* Settings Dropdown */}
            {showSettings && (
                <div className="absolute right-6 top-14 z-50 w-64 rounded-xl border border-white/10 bg-[#0a0c12] p-4 shadow-2xl">
                    <h4 className="text-xs font-semibold text-white mb-3">Settings</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase">Cycle Interval (minutes)</label>
                            <select
                                value={interval}
                                onChange={(e) => setInterval(Number(e.target.value))}
                                className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white px-3 py-1.5 focus:outline-none focus:border-cyan-500/50"
                            >
                                <option value={1}>1 min</option>
                                <option value={2}>2 min</option>
                                <option value={5}>5 min</option>
                                <option value={10}>10 min</option>
                                <option value={15}>15 min</option>
                            </select>
                        </div>
                        <div className="text-[10px] text-zinc-600">
                            Market hours: 9:15 AM — 3:30 PM IST
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20">
                    <p className="text-xs text-rose-400">{error}</p>
                </div>
            )}
        </header>
    );
};

const AutoTradeContent = () => {
    return (
        <div className="p-6 space-y-4 bg-[#080a0f] min-h-full text-white">
            {/* Market Overview Bar */}
            <MarketOverviewBar />

            {/* Orchestrator Pipeline */}
            <OrchestratorTimeline />

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-4">
                {/* Left Column — Agent Status + Sentiment */}
                <div className="col-span-3 space-y-4">
                    <AgentStatusPanel />
                    <SentimentGauge />
                </div>

                {/* Center — Greeks + Active Trades */}
                <div className="col-span-5 space-y-4">
                    <GreeksPanel />
                    <ActiveTradesPanel />
                </div>

                {/* Right — Risk + Decisions */}
                <div className="col-span-4 space-y-4">
                    <RiskDashboard />
                    <DecisionLog />
                </div>
            </div>
        </div>
    );
};

const AutoTrade = () => {
    return (
        <AutoTradeProvider>
            <MainLayout header={<AutoTradeHeader />}>
                <AutoTradeContent />
            </MainLayout>
        </AutoTradeProvider>
    );
};

export default AutoTrade;
