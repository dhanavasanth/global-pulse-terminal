import { useState, useEffect, useCallback } from "react";
import {
    Activity,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    AlertTriangle,
    BarChart2,
    Cpu,
    Layers,
    Globe,
    Zap,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IndexData {
    symbol: string;
    name: string;
    last: number;
    change: number;
    pChange: number;
}

interface AgentInsight {
    agent: string;
    emoji: string;
    status: "idle" | "running" | "done" | "error";
    signal: "bullish" | "bearish" | "neutral" | "unknown";
    summary: string;
    confidence: number;
}

interface OptionChainRow {
    strikePrice: number;
    callOI: number;
    callVolume: number;
    callLTP: number;
    putOI: number;
    putVolume: number;
    putLTP: number;
}

interface MarketOverview {
    indices?: IndexData[];
    vix?: number;
    timestamp?: string;
    market_open?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE = "http://localhost:8000";

async function fetchJSON<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${BASE}${path}`);
        if (!res.ok) return null;
        return res.json() as Promise<T>;
    } catch {
        return null;
    }
}

function pct(val: number) {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
}

function colorClass(val: number) {
    return val >= 0 ? "text-emerald-400" : "text-rose-400";
}

function oiToLakh(oi: number) {
    return (oi / 100000).toFixed(1) + "L";
}

// ─── Mock data fallback (shown when backend is offline) ───────────────────────

const MOCK_INDICES: IndexData[] = [
    { symbol: "NIFTY 50", name: "NIFTY 50", last: 24156.2, change: 112.4, pChange: 0.47 },
    { symbol: "NIFTY BANK", name: "NIFTY BANK", last: 51320.8, change: -88.6, pChange: -0.17 },
    { symbol: "NIFTY IT", name: "NIFTY IT", last: 37840.5, change: 340.2, pChange: 0.91 },
    { symbol: "NIFTY MID100", name: "NIFTY MIDCAP 100", last: 53210.3, change: 210.6, pChange: 0.4 },
    { symbol: "INDIA VIX", name: "INDIA VIX", last: 14.32, change: -0.42, pChange: -2.85 },
    { symbol: "NIFTY AUTO", name: "NIFTY AUTO", last: 22450.7, change: 180.3, pChange: 0.81 },
];

const MOCK_AGENTS: AgentInsight[] = [
    { agent: "Data Fetcher", emoji: "📊", status: "done", signal: "neutral", summary: "Market data loaded. NSE data unavailable — backend offline.", confidence: 0 },
    { agent: "Sentiment Analyzer", emoji: "💭", status: "idle", signal: "unknown", summary: "Awaiting orchestrator start.", confidence: 0 },
    { agent: "Technical Analyzer", emoji: "📈", status: "idle", signal: "unknown", summary: "Awaiting orchestrator start.", confidence: 0 },
    { agent: "Risk Metrics", emoji: "⚠️", status: "idle", signal: "unknown", summary: "Awaiting orchestrator start.", confidence: 0 },
    { agent: "Decision Maker", emoji: "🎯", status: "idle", signal: "unknown", summary: "Awaiting orchestrator start.", confidence: 0 },
    { agent: "Monitor", emoji: "👁️", status: "idle", signal: "unknown", summary: "Awaiting orchestrator start.", confidence: 0 },
];

const MOCK_OPTIONS: OptionChainRow[] = [
    { strikePrice: 23900, callOI: 520000, callVolume: 88200, callLTP: 312.4, putOI: 180000, putVolume: 42000, putLTP: 48.2 },
    { strikePrice: 24000, callOI: 980000, callVolume: 210000, callLTP: 228.6, putOI: 310000, putVolume: 76000, putLTP: 72.4 },
    { strikePrice: 24100, callOI: 740000, callVolume: 164000, callLTP: 152.8, putOI: 420000, putVolume: 98000, putLTP: 108.6 },
    { strikePrice: 24200, callOI: 1240000, callVolume: 310000, callLTP: 88.4, putOI: 680000, putVolume: 148000, putLTP: 158.2 },
    { strikePrice: 24300, callOI: 860000, callVolume: 192000, callLTP: 42.6, putOI: 520000, putVolume: 122000, putLTP: 224.8 },
    { strikePrice: 24400, callOI: 640000, callVolume: 132000, callLTP: 18.8, putOI: 380000, putVolume: 86000, putLTP: 310.6 },
    { strikePrice: 24500, callOI: 420000, callVolume: 88000, callLTP: 8.2, putOI: 280000, putVolume: 62000, putLTP: 418.4 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function IndexCard({ idx }: { idx: IndexData }) {
    const up = idx.pChange >= 0;
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition-colors">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{idx.symbol}</span>
                {up
                    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                }
            </div>
            <p className="text-lg font-bold text-white font-mono">{idx.last.toLocaleString("en-IN")}</p>
            <p className={`text-xs font-medium mt-0.5 ${colorClass(idx.pChange)}`}>
                {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(1)} {pct(idx.pChange)}
            </p>
        </div>
    );
}

function AgentCard({ agent }: { agent: AgentInsight }) {
    const signalColor = {
        bullish: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        bearish: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        neutral: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        unknown: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    }[agent.signal];

    const statusDot = {
        idle: "bg-zinc-500",
        running: "bg-amber-400 animate-pulse",
        done: "bg-emerald-400",
        error: "bg-rose-400",
    }[agent.status];

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">{agent.emoji}</span>
                    <span className="text-xs font-semibold text-white">{agent.agent}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${signalColor} uppercase`}>
                        {agent.signal}
                    </span>
                </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">{agent.summary}</p>
            {agent.confidence > 0 && (
                <div>
                    <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5">
                        <span>Confidence</span>
                        <span>{(agent.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${agent.confidence * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function OptionRow({ row, isAtm }: { row: OptionChainRow; isAtm: boolean }) {
    const maxOI = 1400000;
    const callPct = Math.min((row.callOI / maxOI) * 100, 100);
    const putPct = Math.min((row.putOI / maxOI) * 100, 100);

    return (
        <tr className={`text-xs border-b border-white/5 hover:bg-white/5 transition-colors ${isAtm ? "bg-cyan-500/5" : ""}`}>
            {/* Call side */}
            <td className="py-2 px-3 text-right font-mono text-zinc-300">{oiToLakh(row.callOI)}</td>
            <td className="py-2 px-3 text-right">
                <div className="relative h-1.5 bg-white/10 rounded-full w-20 ml-auto">
                    <div className="absolute right-0 h-full bg-emerald-500/60 rounded-full" style={{ width: `${callPct}%` }} />
                </div>
            </td>
            <td className="py-2 px-3 text-right font-mono text-emerald-400">{row.callLTP.toFixed(1)}</td>

            {/* Strike */}
            <td className={`py-2 px-3 text-center font-bold font-mono ${isAtm ? "text-cyan-400" : "text-white"}`}>
                {row.strikePrice.toLocaleString()}
                {isAtm && <span className="ml-1 text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded">ATM</span>}
            </td>

            {/* Put side */}
            <td className="py-2 px-3 text-left font-mono text-rose-400">{row.putLTP.toFixed(1)}</td>
            <td className="py-2 px-3 text-left">
                <div className="relative h-1.5 bg-white/10 rounded-full w-20">
                    <div className="absolute left-0 h-full bg-rose-500/60 rounded-full" style={{ width: `${putPct}%` }} />
                </div>
            </td>
            <td className="py-2 px-3 text-left font-mono text-zinc-300">{oiToLakh(row.putOI)}</td>
        </tr>
    );
}

// ─── Market Breadth component ─────────────────────────────────────────────────

function MarketBreadthBar({ advances = 1240, declines = 820, unchanged = 140 }: {
    advances?: number; declines?: number; unchanged?: number;
}) {
    const total = advances + declines + unchanged;
    const advPct = (advances / total) * 100;
    const decPct = (declines / total) * 100;
    const unchPct = (unchanged / total) * 100;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-semibold text-white">Market Breadth</span>
                <span className="ml-auto text-[10px] text-zinc-500">NSE · {total.toLocaleString()} stocks</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                <div className="bg-emerald-500 transition-all" style={{ width: `${advPct}%` }} />
                <div className="bg-zinc-600 transition-all" style={{ width: `${unchPct}%` }} />
                <div className="bg-rose-500 transition-all" style={{ width: `${decPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-emerald-400">▲ Advances: {advances.toLocaleString()} ({advPct.toFixed(1)}%)</span>
                <span className="text-zinc-400">= {unchanged}</span>
                <span className="text-rose-400">▼ Declines: {declines.toLocaleString()} ({decPct.toFixed(1)}%)</span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NSEDashboard() {
    const [indices, setIndices] = useState<IndexData[]>(MOCK_INDICES);
    const [agents, setAgents] = useState<AgentInsight[]>(MOCK_AGENTS);
    const [options, setOptions] = useState<OptionChainRow[]>(MOCK_OPTIONS);
    const [vix, setVix] = useState<number>(14.32);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [backendOnline, setBackendOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latestCycle, setLatestCycle] = useState<any>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            // Try to fetch from backend
            const [overview, latest] = await Promise.all([
                fetchJSON<MarketOverview>("/api/nse/overview"),
                fetchJSON<any>("/api/autotrade/latest"),
            ]);

            if (overview) {
                setBackendOnline(true);
                if (overview.indices?.length) setIndices(overview.indices);
                if (overview.vix) setVix(overview.vix);
                if (overview.timestamp) setLastUpdated(new Date(overview.timestamp).toLocaleTimeString());
            } else {
                setBackendOnline(false);
                setLastUpdated(new Date().toLocaleTimeString() + " (offline)");
            }

            if (latest) {
                setLatestCycle(latest);
                // Map cycle agent statuses to our display format
                const completedAgents: string[] = latest.agents_completed ?? [];
                setAgents(MOCK_AGENTS.map((a) => {
                    const key = a.agent.toLowerCase().replace(/ /g, "_");
                    const done = completedAgents.some((c: string) => c.toLowerCase().includes(key.split("_")[0]));
                    let signal: AgentInsight["signal"] = "unknown";
                    if (done) {
                        const sentiment = latest.sentiment?.label?.toLowerCase() ?? "";
                        const risk = latest.risk?.label?.toLowerCase() ?? "";
                        if (a.agent === "Sentiment Analyzer") signal = sentiment.includes("bull") ? "bullish" : sentiment.includes("bear") ? "bearish" : "neutral";
                        else if (a.agent === "Risk Metrics") signal = risk.includes("high") ? "bearish" : risk.includes("low") ? "bullish" : "neutral";
                        else if (a.agent === "Decision Maker") {
                            const action = latest.decision?.primary_action?.action ?? "";
                            signal = action === "BUY" ? "bullish" : action === "SELL" ? "bearish" : "neutral";
                        } else signal = "neutral";
                    }
                    return {
                        ...a,
                        status: done ? "done" : "idle",
                        signal,
                        summary: done
                            ? (a.agent === "Decision Maker" ? (latest.decision?.ai_reasoning?.summary ?? latest.summary ?? "Analysis complete.") : "Analysis complete.")
                            : a.summary,
                        confidence: done ? (latest.decision?.confidence ?? 0) : 0,
                    };
                }));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = window.setInterval(refresh, 30000);
        return () => window.clearInterval(interval);
    }, [refresh]);

    const atmIndex = Math.floor(options.length / 2);

    const pageHeader = (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0f]/95 backdrop-blur-xl">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                            NSE Bloomberg Terminal
                        </h1>
                        <p className="text-[10px] text-zinc-500">Indian Markets · Real-time Intelligence</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${backendOnline
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${backendOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        {backendOnline ? "Backend Live" : "Demo Mode"}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-[10px] text-zinc-500">Updated: {lastUpdated}</span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-xs hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>
        </header>
    );

    return (
        <MainLayout header={pageHeader}>
        <div className="p-6 space-y-5 bg-[#080a0f] min-h-full text-white">

                {/* ── VIX + India Risk Banner ── */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1 rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-rose-500/5 p-4">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">India VIX</p>
                        <p className="text-3xl font-bold font-mono text-white">{vix.toFixed(2)}</p>
                        <p className={`text-xs mt-1 ${vix > 18 ? "text-rose-400" : vix > 14 ? "text-amber-400" : "text-emerald-400"}`}>
                            {vix > 18 ? "⚠️ High Volatility" : vix > 14 ? "~  Moderate" : "✓ Low Volatility"}
                        </p>
                    </div>
                    <div className="col-span-3 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-semibold text-white">Market Intelligence Summary</span>
                            {latestCycle && (
                                <span className="ml-auto text-[10px] text-zinc-500">Cycle #{latestCycle.cycle_number ?? "—"}</span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                            {latestCycle?.summary
                                ?? "Start the AutoTrade AI Hub to get live multi-agent market analysis. Navigate to AutoTrade AI in the sidebar to begin the orchestrator."}
                        </p>
                        {latestCycle && (
                            <div className="flex gap-3 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${latestCycle.risk?.label === "HIGH" ? "bg-rose-500/20 text-rose-400" : latestCycle.risk?.label === "LOW" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    Risk: {latestCycle.risk?.label ?? "—"} ({(latestCycle.risk?.score ?? 0).toFixed(1)})
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${latestCycle.sentiment?.score > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                                    Sentiment: {latestCycle.sentiment?.label ?? "—"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">
                                    Regime: {latestCycle.decision?.market_regime ?? "—"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Indices Grid ── */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-zinc-400" />
                        <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">NSE Indices</h2>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {indices.map((idx) => (
                            <IndexCard key={idx.symbol} idx={idx} />
                        ))}
                    </div>
                </section>

                {/* ── Market Breadth ── */}
                <MarketBreadthBar />

                {/* ── Agent Insights + Options Chain ── */}
                <div className="grid grid-cols-12 gap-4">

                    {/* Agent Insights */}
                    <div className="col-span-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-zinc-400" />
                            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Agent Insights</h2>
                            <span className="ml-auto text-[10px] text-zinc-500">AutoTrade AI</span>
                        </div>
                        {agents.map((a) => (
                            <AgentCard key={a.agent} agent={a} />
                        ))}
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                                <span className="text-[10px] font-semibold text-cyan-400">Start Agent Workflow</span>
                            </div>
                            <p className="text-[10px] text-zinc-400">
                                Go to <span className="text-cyan-400 font-medium">AutoTrade AI</span> in the sidebar to start the multi-agent orchestrator and get live AI-powered market analysis.
                            </p>
                        </div>
                    </div>

                    {/* Options Chain */}
                    <div className="col-span-8 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                            <Layers className="h-4 w-4 text-zinc-400" />
                            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">NIFTY Options Chain</h2>
                            <span className="ml-auto text-[10px] text-zinc-500">Current Expiry · Nearest Strikes</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] text-zinc-500 uppercase border-b border-white/5">
                                        <th className="py-2 px-3 text-right">Call OI</th>
                                        <th className="py-2 px-3 text-right">OI Bar</th>
                                        <th className="py-2 px-3 text-right text-emerald-400">Call LTP</th>
                                        <th className="py-2 px-3 text-center">Strike</th>
                                        <th className="py-2 px-3 text-left text-rose-400">Put LTP</th>
                                        <th className="py-2 px-3 text-left">OI Bar</th>
                                        <th className="py-2 px-3 text-left">Put OI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {options.map((row, i) => (
                                        <OptionRow key={row.strikePrice} row={row} isAtm={i === atmIndex} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 border-t border-white/5 text-[9px] text-zinc-600">
                            PCR (Put/Call Ratio): {(options.reduce((s, r) => s + r.putOI, 0) / options.reduce((s, r) => s + r.callOI, 0)).toFixed(2)} · OI in Lakhs
                        </div>
                    </div>
                </div>

                {/* ── Workflow Status (from AutoTrade context) ── */}
                {latestCycle?.agents_completed?.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-zinc-400" />
                            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Last Agent Workflow Run</h2>
                            <span className="ml-auto text-[10px] text-zinc-500">{latestCycle.timestamp ? new Date(latestCycle.timestamp).toLocaleString() : ""}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {latestCycle.agents_completed.map((agent: string) => (
                                <span key={agent} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    ✓ {agent}
                                </span>
                            ))}
                        </div>
                        {latestCycle.errors?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {latestCycle.errors.map((err: any, i: number) => (
                                    <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        ✗ {err.agent ?? err}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
        </div>
        </MainLayout>
    );
}
