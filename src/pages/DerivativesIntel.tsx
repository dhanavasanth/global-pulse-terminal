import { useState, useEffect, useCallback, Component, ReactNode } from "react";
import {
    Activity,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    BarChart3,
    Layers,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Target,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OISpur {
    symbol: string;
    ltp: number;
    prev_close: number;
    pct_change_price: number;
    prev_oi: number;
    curr_oi: number;
    change_oi: number;
    pct_change_oi: number;
    volume: number;
    interpretation: "long_buildup" | "short_buildup" | "short_covering" | "long_unwinding";
}

interface ActiveContract {
    contract_type: string;
    symbol: string;
    instrument: string;
    expiry: string;
    strike: number;
    option_type: string;
    ltp: number;
    pct_change: number;
    volume: number;
    value: number;
    oi: number;
}

interface ActiveUnderlying {
    symbol: string;
    last_price: number;
    pct_change: number;
    total_contracts: number;
    total_value: number;
    futures_oi: number;
    options_oi: number;
}

interface GainerLoser {
    symbol: string;
    last_price: number;
    change: number;
    pct_change: number;
    volume: number;
}

interface OptionChainSummary {
    symbol: string;
    spot_price: number;
    atm_strike: number;
    pcr: { oi: number; volume: number; signal: string };
    max_pain: { strike: number };
    straddle_premium: number;
    iv_data: { atm_iv_avg: number; iv_skew: number; skew_signal: string };
    current_expiry: string;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJSON<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return res.json() as Promise<T>;
    } catch {
        return null;
    }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function pct(val: number | undefined | null) {
    const v = Number(val) || 0;
    const sign = v >= 0 ? "+" : "";
    return `${sign}${v.toFixed(2)}%`;
}

function color(val: number | undefined | null) {
    return (Number(val) || 0) >= 0 ? "text-emerald-400" : "text-rose-400";
}

function num(val: number | undefined | null) {
    const v = Number(val) || 0;
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    if (abs >= 10000000) return sign + (abs / 10000000).toFixed(1) + "Cr";
    if (abs >= 100000) return sign + (abs / 100000).toFixed(1) + "L";
    if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + "K";
    return v.toLocaleString("en-IN");
}

function safe(val: number | undefined | null, decimals = 2): string {
    return (Number(val) || 0).toFixed(decimals);
}

const INTERPRETATION_MAP: Record<string, { label: string; color: string; icon: "up" | "down" }> = {
    long_buildup: { label: "Long Buildup", color: "text-emerald-400 bg-emerald-500/10", icon: "up" },
    short_buildup: { label: "Short Buildup", color: "text-rose-400 bg-rose-500/10", icon: "down" },
    short_covering: { label: "Short Cover", color: "text-cyan-400 bg-cyan-500/10", icon: "up" },
    long_unwinding: { label: "Long Unwind", color: "text-amber-400 bg-amber-500/10", icon: "down" },
};

// ─── Mock data (shown when backend is offline) ───────────────────────────────

const MOCK_OI_SPURTS: OISpur[] = [
    { symbol: "RELIANCE", ltp: 2480.5, prev_close: 2445.0, pct_change_price: 1.45, prev_oi: 12500000, curr_oi: 14200000, change_oi: 1700000, pct_change_oi: 13.6, volume: 8800000, interpretation: "long_buildup" },
    { symbol: "HDFCBANK", ltp: 1652.3, prev_close: 1670.0, pct_change_price: -1.06, prev_oi: 18900000, curr_oi: 21400000, change_oi: 2500000, pct_change_oi: 13.2, volume: 12400000, interpretation: "short_buildup" },
    { symbol: "TATAMOTORS", ltp: 742.8, prev_close: 720.5, pct_change_price: 3.1, prev_oi: 22000000, curr_oi: 19800000, change_oi: -2200000, pct_change_oi: -10.0, volume: 15600000, interpretation: "short_covering" },
    { symbol: "INFY", ltp: 1485.0, prev_close: 1510.0, pct_change_price: -1.66, prev_oi: 14200000, curr_oi: 12100000, change_oi: -2100000, pct_change_oi: -14.8, volume: 9200000, interpretation: "long_unwinding" },
    { symbol: "ICICIBANK", ltp: 1128.4, prev_close: 1105.0, pct_change_price: 2.12, prev_oi: 16700000, curr_oi: 18900000, change_oi: 2200000, pct_change_oi: 13.2, volume: 11800000, interpretation: "long_buildup" },
    { symbol: "SBIN", ltp: 625.6, prev_close: 638.0, pct_change_price: -1.94, prev_oi: 28400000, curr_oi: 31200000, change_oi: 2800000, pct_change_oi: 9.9, volume: 22000000, interpretation: "short_buildup" },
    { symbol: "BAJFINANCE", ltp: 6842.0, prev_close: 6720.0, pct_change_price: 1.81, prev_oi: 4800000, curr_oi: 3900000, change_oi: -900000, pct_change_oi: -18.8, volume: 3200000, interpretation: "short_covering" },
    { symbol: "TCS", ltp: 3890.0, prev_close: 3920.0, pct_change_price: -0.77, prev_oi: 8200000, curr_oi: 7100000, change_oi: -1100000, pct_change_oi: -13.4, volume: 4800000, interpretation: "long_unwinding" },
];

const MOCK_ACTIVE_FUTURES: ActiveContract[] = [
    { contract_type: "futures", symbol: "NIFTY", instrument: "FUTIDX", expiry: "27-Feb-2025", strike: 0, option_type: "", ltp: 24180.5, pct_change: 0.42, volume: 185000, value: 44520, oi: 12800000 },
    { contract_type: "futures", symbol: "BANKNIFTY", instrument: "FUTIDX", expiry: "27-Feb-2025", strike: 0, option_type: "", ltp: 51420.0, pct_change: -0.18, volume: 92000, value: 23680, oi: 6200000 },
    { contract_type: "futures", symbol: "RELIANCE", instrument: "FUTSTK", expiry: "27-Feb-2025", strike: 0, option_type: "", ltp: 2482.0, pct_change: 1.48, volume: 48000, value: 5952, oi: 8400000 },
    { contract_type: "futures", symbol: "TATAMOTORS", instrument: "FUTSTK", expiry: "27-Feb-2025", strike: 0, option_type: "", ltp: 744.5, pct_change: 3.15, volume: 42000, value: 1562, oi: 15200000 },
    { contract_type: "futures", symbol: "HDFCBANK", instrument: "FUTSTK", expiry: "27-Feb-2025", strike: 0, option_type: "", ltp: 1654.0, pct_change: -1.02, volume: 38000, value: 3145, oi: 11200000 },
];

const MOCK_ACTIVE_OPTIONS: ActiveContract[] = [
    { contract_type: "options", symbol: "NIFTY", instrument: "OPTIDX", expiry: "27-Feb-2025", strike: 24200, option_type: "CE", ltp: 88.4, pct_change: 12.5, volume: 420000, value: 18564, oi: 12400000 },
    { contract_type: "options", symbol: "NIFTY", instrument: "OPTIDX", expiry: "27-Feb-2025", strike: 24200, option_type: "PE", ltp: 158.2, pct_change: -8.4, volume: 380000, value: 30058, oi: 9800000 },
    { contract_type: "options", symbol: "BANKNIFTY", instrument: "OPTIDX", expiry: "27-Feb-2025", strike: 51500, option_type: "CE", ltp: 142.0, pct_change: -15.2, volume: 210000, value: 14910, oi: 4200000 },
    { contract_type: "options", symbol: "BANKNIFTY", instrument: "OPTIDX", expiry: "27-Feb-2025", strike: 51500, option_type: "PE", ltp: 228.5, pct_change: 22.4, volume: 185000, value: 21137, oi: 3800000 },
    { contract_type: "options", symbol: "RELIANCE", instrument: "OPTSTK", expiry: "27-Feb-2025", strike: 2500, option_type: "CE", ltp: 42.0, pct_change: 28.0, volume: 95000, value: 1995, oi: 5600000 },
];

const MOCK_ACTIVE_UNDERLYING: ActiveUnderlying[] = [
    { symbol: "NIFTY", last_price: 24156.2, pct_change: 0.47, total_contracts: 1840000, total_value: 222080, futures_oi: 12800000, options_oi: 48200000 },
    { symbol: "BANKNIFTY", last_price: 51320.8, pct_change: -0.17, total_contracts: 920000, total_value: 118240, futures_oi: 6200000, options_oi: 28400000 },
    { symbol: "RELIANCE", last_price: 2480.5, pct_change: 1.45, total_contracts: 280000, total_value: 34720, futures_oi: 8400000, options_oi: 12800000 },
    { symbol: "TATAMOTORS", last_price: 742.8, pct_change: 3.1, total_contracts: 240000, total_value: 8912, futures_oi: 15200000, options_oi: 18600000 },
    { symbol: "HDFCBANK", last_price: 1652.3, pct_change: -1.06, total_contracts: 210000, total_value: 17353, futures_oi: 11200000, options_oi: 14200000 },
    { symbol: "INFY", last_price: 1485.0, pct_change: -1.66, total_contracts: 180000, total_value: 13365, futures_oi: 9200000, options_oi: 11800000 },
];

const MOCK_CHAIN: OptionChainSummary = {
    symbol: "NIFTY",
    spot_price: 24156.2,
    atm_strike: 24200,
    pcr: { oi: 0.85, volume: 0.91, signal: "neutral" },
    max_pain: { strike: 24200 },
    straddle_premium: 246.6,
    iv_data: { atm_iv_avg: 14.8, iv_skew: -0.4, skew_signal: "normal" },
    current_expiry: "27-Feb-2025",
};

const MOCK_GAINERS: GainerLoser[] = [
    { symbol: "TATAMOTORS", last_price: 742.8, change: 22.3, pct_change: 3.1, volume: 15600000 },
    { symbol: "BAJFINANCE", last_price: 6842.0, change: 122.0, pct_change: 1.81, volume: 3200000 },
    { symbol: "ICICIBANK", last_price: 1128.4, change: 23.4, pct_change: 2.12, volume: 11800000 },
    { symbol: "RELIANCE", last_price: 2480.5, change: 35.5, pct_change: 1.45, volume: 8800000 },
    { symbol: "MARUTI", last_price: 10842.0, change: 128.0, pct_change: 1.19, volume: 1200000 },
];

const MOCK_LOSERS: GainerLoser[] = [
    { symbol: "SBIN", last_price: 625.6, change: -12.4, pct_change: -1.94, volume: 22000000 },
    { symbol: "INFY", last_price: 1485.0, change: -25.0, pct_change: -1.66, volume: 9200000 },
    { symbol: "HDFCBANK", last_price: 1652.3, change: -17.7, pct_change: -1.06, volume: 12400000 },
    { symbol: "TCS", last_price: 3890.0, change: -30.0, pct_change: -0.77, volume: 4800000 },
    { symbol: "WIPRO", last_price: 478.2, change: -3.2, pct_change: -0.66, volume: 6400000 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-zinc-400" />
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{title}</h2>
            {subtitle && <span className="ml-auto text-[10px] text-zinc-500">{subtitle}</span>}
        </div>
    );
}

function InterpretationBadge({ type }: { type: string }) {
    const info = INTERPRETATION_MAP[type] ?? { label: type, color: "text-zinc-400 bg-zinc-500/10", icon: "up" as const };
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${info.color}`}>
            {info.icon === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {info.label}
        </span>
    );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold font-mono ${accent ?? "text-white"}`}>{value}</p>
            {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
    );
}

function MoverRow({ item, rank }: { item: GainerLoser; rank: number }) {
    const isUp = item.pct_change >= 0;
    return (
        <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[10px] text-zinc-600 w-4 text-right">{rank}</span>
            <span className="text-xs font-medium text-white flex-1 font-mono">{item.symbol}</span>
            <span className="text-xs font-mono text-zinc-300 w-16 text-right">{item.last_price.toLocaleString("en-IN")}</span>
            <span className={`text-[11px] font-mono w-16 text-right font-medium ${color(item.pct_change)}`}>{pct(item.pct_change)}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DerivativesIntel() {
    const [oiSpurts, setOiSpurts] = useState<OISpur[]>(MOCK_OI_SPURTS);
    const [activeFutures, setActiveFutures] = useState<ActiveContract[]>(MOCK_ACTIVE_FUTURES);
    const [activeOptions, setActiveOptions] = useState<ActiveContract[]>(MOCK_ACTIVE_OPTIONS);
    const [activeUnderlying, setActiveUnderlying] = useState<ActiveUnderlying[]>(MOCK_ACTIVE_UNDERLYING);
    const [chainSummary, setChainSummary] = useState<OptionChainSummary>(MOCK_CHAIN);
    const [gainers, setGainers] = useState<GainerLoser[]>(MOCK_GAINERS);
    const [losers, setLosers] = useState<GainerLoser[]>(MOCK_LOSERS);
    const [backendOnline, setBackendOnline] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"oi_spurts" | "active_contracts" | "active_underlying">("oi_spurts");

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [intel, chainData, pulseData] = await Promise.all([
                fetchJSON<any>("/api/nse/derivatives-intel"),
                fetchJSON<OptionChainSummary>("/api/nse/options/NIFTY"),
                fetchJSON<any>("/api/nse/pulse"),
            ]);

            if (intel) {
                setBackendOnline(true);
                if (intel.oi_spurts?.length) setOiSpurts(intel.oi_spurts);
                if (intel.most_active_futures?.length) setActiveFutures(intel.most_active_futures);
                if (intel.most_active_options?.length) setActiveOptions(intel.most_active_options);
                if (intel.most_active_underlying?.length) setActiveUnderlying(intel.most_active_underlying);
            }

            if (chainData && chainData.spot_price) {
                setChainSummary(chainData);
            }

            if (pulseData) {
                if (pulseData.top_gainers?.length) setGainers(pulseData.top_gainers.slice(0, 5));
                if (pulseData.top_losers?.length) setLosers(pulseData.top_losers.slice(0, 5));
            }

            setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } catch {
            // keep mock data
        }
        setLoading(false);
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => {
        const id = setInterval(refresh, 45000);
        return () => clearInterval(id);
    }, [refresh]);

    // ── Derived stats ──
    const longBuildups = oiSpurts.filter(s => s.interpretation === "long_buildup").length;
    const shortBuildups = oiSpurts.filter(s => s.interpretation === "short_buildup").length;
    const shortCovers = oiSpurts.filter(s => s.interpretation === "short_covering").length;
    const longUnwinds = oiSpurts.filter(s => s.interpretation === "long_unwinding").length;

    const pcrOi = chainSummary?.pcr?.oi ?? 0;
    const atmIv = chainSummary?.iv_data?.atm_iv_avg ?? 0;
    const pcrColor = pcrOi > 1.2 ? "text-rose-400" : pcrOi < 0.7 ? "text-emerald-400" : "text-amber-400";
    const ivColor = atmIv > 18 ? "text-rose-400" : atmIv > 14 ? "text-amber-400" : "text-emerald-400";

    // ── Header ──
    const pageHeader = (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0f]/95 backdrop-blur-xl">
            <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Derivatives Intelligence
                        </h1>
                        <p className="text-[10px] text-zinc-500">OI Spurts · Active Contracts · F&O Pulse</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${backendOnline
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${backendOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        {backendOnline ? "Live" : "Demo"}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && <span className="text-[10px] text-zinc-500">Updated: {lastUpdated}</span>}
                    <button onClick={refresh} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-xs hover:bg-white/10 transition-all disabled:opacity-50">
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

                {/* ── Row 1: Key Metrics ── */}
                <div className="grid grid-cols-6 gap-3">
                    <StatCard label="NIFTY Spot" value={(chainSummary?.spot_price ?? 0).toLocaleString("en-IN")} sub={`ATM ${chainSummary?.atm_strike ?? "—"}`} />
                    <StatCard label="PCR (OI)" value={safe(pcrOi)} sub={chainSummary?.pcr?.signal ?? "—"} accent={pcrColor} />
                    <StatCard label="ATM IV" value={safe(atmIv, 1) + "%"} sub={`Skew: ${safe(chainSummary?.iv_data?.iv_skew, 1)}`} accent={ivColor} />
                    <StatCard label="Max Pain" value={(chainSummary?.max_pain?.strike ?? 0).toLocaleString("en-IN")} sub={`Expiry: ${chainSummary?.current_expiry ?? "—"}`} />
                    <StatCard label="Straddle" value={"₹" + safe(chainSummary?.straddle_premium, 0)} sub="ATM CE+PE premium" />
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">OI Sentiment</p>
                        <div className="flex gap-1 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">{longBuildups}L</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">{shortBuildups}S</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{shortCovers}SC</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">{longUnwinds}LU</span>
                        </div>
                        <p className={`text-xs font-bold mt-1 ${longBuildups + shortCovers > shortBuildups + longUnwinds ? "text-emerald-400" : "text-rose-400"}`}>
                            {longBuildups + shortCovers > shortBuildups + longUnwinds ? "Net Bullish" : "Net Bearish"}
                        </p>
                    </div>
                </div>

                {/* ── Row 2: Tab selector for main tables ── */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
                    {([
                        { key: "oi_spurts", label: "OI Spurts", icon: Flame },
                        { key: "active_contracts", label: "Active Contracts", icon: Zap },
                        { key: "active_underlying", label: "Active Underlying", icon: Target },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                                ? "bg-white/10 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}

                {activeTab === "oi_spurts" && (
                    <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-400" />
                            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Change in Open Interest — OI Spurts</span>
                            <span className="ml-auto text-[10px] text-zinc-500">{oiSpurts.length} contracts</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] text-zinc-500 uppercase border-b border-white/5">
                                        <th className="py-2 px-3 text-left">Symbol</th>
                                        <th className="py-2 px-3 text-right">LTP</th>
                                        <th className="py-2 px-3 text-right">Chg%</th>
                                        <th className="py-2 px-3 text-right">Prev OI</th>
                                        <th className="py-2 px-3 text-right">Curr OI</th>
                                        <th className="py-2 px-3 text-right">OI Chg</th>
                                        <th className="py-2 px-3 text-right">OI Chg%</th>
                                        <th className="py-2 px-3 text-right">Volume</th>
                                        <th className="py-2 px-3 text-left">Signal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {oiSpurts.map((s) => (
                                        <tr key={s.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-2 px-3 text-xs font-medium text-white font-mono">{s.symbol}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-right">{s.ltp.toLocaleString("en-IN")}</td>
                                            <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(s.pct_change_price)}`}>{pct(s.pct_change_price)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(s.prev_oi)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-right">{num(s.curr_oi)}</td>
                                            <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(s.change_oi)}`}>{s.change_oi > 0 ? "+" : ""}{num(s.change_oi)}</td>
                                            <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(s.pct_change_oi)}`}>{pct(s.pct_change_oi)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(s.volume)}</td>
                                            <td className="py-2 px-3"><InterpretationBadge type={s.interpretation} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 border-t border-white/5 text-[9px] text-zinc-600">
                            OI up + Price up = Long Buildup (Bullish) · OI up + Price down = Short Buildup (Bearish) · OI down + Price up = Short Covering · OI down + Price down = Long Unwinding
                        </div>
                    </section>
                )}

                {activeTab === "active_contracts" && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Most Active Futures */}
                        <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-blue-400" />
                                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Most Active Futures</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[9px] text-zinc-500 uppercase border-b border-white/5">
                                            <th className="py-2 px-3 text-left">Symbol</th>
                                            <th className="py-2 px-3 text-right">LTP</th>
                                            <th className="py-2 px-3 text-right">Chg%</th>
                                            <th className="py-2 px-3 text-right">Volume</th>
                                            <th className="py-2 px-3 text-right">OI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeFutures.map((c, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-2 px-3 text-xs font-medium text-white font-mono">{c.symbol}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-right">{c.ltp.toLocaleString("en-IN")}</td>
                                                <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(c.pct_change)}`}>{pct(c.pct_change)}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(c.volume)}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(c.oi)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Most Active Options */}
                        <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-violet-400" />
                                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Most Active Options</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[9px] text-zinc-500 uppercase border-b border-white/5">
                                            <th className="py-2 px-3 text-left">Symbol</th>
                                            <th className="py-2 px-3 text-center">Strike</th>
                                            <th className="py-2 px-3 text-center">Type</th>
                                            <th className="py-2 px-3 text-right">LTP</th>
                                            <th className="py-2 px-3 text-right">Chg%</th>
                                            <th className="py-2 px-3 text-right">Vol</th>
                                            <th className="py-2 px-3 text-right">OI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeOptions.map((c, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-2 px-3 text-xs font-medium text-white font-mono">{c.symbol}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-center">{c.strike}</td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.option_type === "CE" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                                                        {c.option_type}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-right">{c.ltp.toFixed(1)}</td>
                                                <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(c.pct_change)}`}>{pct(c.pct_change)}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(c.volume)}</td>
                                                <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(c.oi)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === "active_underlying" && (
                    <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                            <Target className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Most Active Underlying (F&O)</span>
                            <span className="ml-auto text-[10px] text-zinc-500">Aggregate futures + options activity</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] text-zinc-500 uppercase border-b border-white/5">
                                        <th className="py-2 px-3 text-left">Symbol</th>
                                        <th className="py-2 px-3 text-right">Last Price</th>
                                        <th className="py-2 px-3 text-right">Chg%</th>
                                        <th className="py-2 px-3 text-right">Contracts</th>
                                        <th className="py-2 px-3 text-right">Value (Cr)</th>
                                        <th className="py-2 px-3 text-right">Futures OI</th>
                                        <th className="py-2 px-3 text-right">Options OI</th>
                                        <th className="py-2 px-3 text-right">Total OI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeUnderlying.map((u) => (
                                        <tr key={u.symbol} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-2 px-3 text-xs font-medium text-white font-mono">{u.symbol}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-300 text-right">{u.last_price.toLocaleString("en-IN")}</td>
                                            <td className={`py-2 px-3 text-xs font-mono text-right font-medium ${color(u.pct_change)}`}>{pct(u.pct_change)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(u.total_contracts)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(u.total_value)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(u.futures_oi)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-zinc-400 text-right">{num(u.options_oi)}</td>
                                            <td className="py-2 px-3 text-xs font-mono text-white text-right font-medium">{num(u.futures_oi + u.options_oi)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── Row 3: Gainers / Losers side-by-side ── */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Top F&O Gainers */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <SectionHeader icon={TrendingUp} title="Top F&O Gainers" />
                        {gainers.map((g, i) => <MoverRow key={g.symbol} item={g} rank={i + 1} />)}
                    </div>

                    {/* Top F&O Losers */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <SectionHeader icon={TrendingDown} title="Top F&O Losers" />
                        {losers.map((l, i) => <MoverRow key={l.symbol} item={l} rank={i + 1} />)}
                    </div>
                </div>

                {/* ── Row 4: Quick Summary for AI Agent ── */}
                <div className="rounded-xl border border-white/10 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Derivatives Summary (AI-Ready)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-[11px] text-zinc-300">
                        <div>
                            <p className="text-zinc-500 text-[10px] mb-1">Market Positioning</p>
                            <p>Long Buildups: <span className="text-emerald-400 font-mono font-medium">{longBuildups}</span></p>
                            <p>Short Buildups: <span className="text-rose-400 font-mono font-medium">{shortBuildups}</span></p>
                            <p>Short Covering: <span className="text-cyan-400 font-mono font-medium">{shortCovers}</span></p>
                            <p>Long Unwinding: <span className="text-amber-400 font-mono font-medium">{longUnwinds}</span></p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] mb-1">NIFTY Options</p>
                            <p>PCR: <span className={`font-mono font-medium ${pcrColor}`}>{safe(pcrOi)}</span></p>
                            <p>Max Pain: <span className="font-mono font-medium text-white">{chainSummary?.max_pain?.strike ?? "—"}</span></p>
                            <p>ATM Straddle: <span className="font-mono font-medium text-white">₹{safe(chainSummary?.straddle_premium, 0)}</span></p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] mb-1">Volatility</p>
                            <p>ATM IV: <span className={`font-mono font-medium ${ivColor}`}>{safe(atmIv, 1)}%</span></p>
                            <p>IV Skew: <span className="font-mono font-medium text-white">{safe(chainSummary?.iv_data?.iv_skew, 1)}</span></p>
                            <p>Skew: <span className="font-mono font-medium text-zinc-300">{chainSummary?.iv_data?.skew_signal ?? "—"}</span></p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] mb-1">Top Signals</p>
                            {oiSpurts.slice(0, 3).map(s => (
                                <p key={s.symbol}>
                                    <span className="font-mono font-medium text-white">{s.symbol}</span>
                                    {" — "}
                                    <span className={INTERPRETATION_MAP[s.interpretation]?.color.split(" ")[0] ?? "text-zinc-400"}>
                                        {INTERPRETATION_MAP[s.interpretation]?.label ?? s.interpretation}
                                    </span>
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(err: Error) {
        return { error: err.message };
    }
    render() {
        if (this.state.error) {
            return (
                <MainLayout>
                    <div className="flex items-center justify-center min-h-[60vh] text-white">
                        <div className="text-center space-y-3">
                            <p className="text-rose-400 text-sm font-medium">Derivatives Intel failed to load</p>
                            <p className="text-zinc-500 text-xs">{this.state.error}</p>
                            <button onClick={() => this.setState({ error: null })} className="px-4 py-2 rounded-lg bg-white/10 text-xs hover:bg-white/20 transition-colors">
                                Retry
                            </button>
                        </div>
                    </div>
                </MainLayout>
            );
        }
        return this.props.children;
    }
}

export default function DerivativesIntelPage() {
    return (
        <ErrorBoundary>
            <DerivativesIntel />
        </ErrorBoundary>
    );
}
