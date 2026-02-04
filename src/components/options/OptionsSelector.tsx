import { useOptions, IndexType } from "@/contexts/OptionsContext";
import {
    Activity, Calendar, ChevronDown, RefreshCw,
    TrendingUp, Search, Zap
} from "lucide-react";

const indices: { value: IndexType; label: string; spot: string }[] = [
    { value: "NIFTY", label: "NIFTY 50", spot: "NSE" },
    { value: "BANKNIFTY", label: "BANK NIFTY", spot: "NSE" },
    { value: "SENSEX", label: "SENSEX", spot: "BSE" },
];

const expiries = [
    "30-Jan-2026",
    "06-Feb-2026",
    "13-Feb-2026",
    "27-Feb-2026",
];

const OptionsSelector = () => {
    const {
        selectedIndex,
        setSelectedIndex,
        atmStrike,
        setAtmStrike,
        expiry,
        setExpiry,
        isLoading,
        fetchData,
        spotPrice,
    } = useOptions();

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left: Index & Spot */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">
                            <span className="text-primary">ATM</span> Strike Selector
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Select index, strike & expiry to analyze
                        </p>
                    </div>
                </div>

                {/* Center: Selectors */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Index Selector */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Index</label>
                        <select
                            value={selectedIndex}
                            onChange={(e) => setSelectedIndex(e.target.value as IndexType)}
                            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
                        >
                            {indices.map((idx) => (
                                <option key={idx.value} value={idx.value}>
                                    {idx.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Spot Price Display */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Spot</label>
                        <div className="bg-secondary/30 border border-border rounded-lg px-3 py-2 min-w-[120px]">
                            <span className="font-mono font-bold text-primary">
                                {spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* ATM Strike Input */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">ATM Strike</label>
                        <input
                            type="number"
                            value={atmStrike}
                            onChange={(e) => setAtmStrike(Number(e.target.value))}
                            step={selectedIndex === "BANKNIFTY" ? 100 : 50}
                            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 w-[120px]"
                        />
                    </div>

                    {/* Expiry Selector */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Expiry
                        </label>
                        <select
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[130px]"
                        >
                            {expiries.map((exp) => (
                                <option key={exp} value={exp}>
                                    {exp}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right: Fetch Button */}
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className={`flex items - center gap - 2 px - 6 py - 3 rounded - xl font - medium text - sm transition - all ${isLoading
                            ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                            : "bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
                        } `}
                >
                    {isLoading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Fetch Full Chart
                        </>
                    )}
                </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
                    <span className="text-muted-foreground">Market Open</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Strike Gap:</span>
                    <span className="font-mono text-primary">
                        {selectedIndex === "BANKNIFTY" ? "100" : "50"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Lot Size:</span>
                    <span className="font-mono text-primary">
                        {selectedIndex === "BANKNIFTY" ? "15" : selectedIndex === "SENSEX" ? "10" : "25"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Exchange:</span>
                    <span className="font-mono text-primary">
                        {indices.find(i => i.value === selectedIndex)?.spot}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OptionsSelector;
