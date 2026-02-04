import { useOptions } from "@/contexts/OptionsContext";
import { ArrowUpCircle, ArrowDownCircle, Crosshair, Clock, CheckCircle, XCircle } from "lucide-react";

const ReEntrySignals = () => {
    const { reEntrySignals, isLoading, atmStrike } = useOptions();

    if (isLoading || reEntrySignals.length === 0) {
        return (
            <div className="glass-card p-4 lg:p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">RE-ENTRY SIGNALS</h2>
                        <p className="text-xs text-muted-foreground">VWAP Retest + STR Confirmation</p>
                    </div>
                </div>
                <div className="h-40 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Awaiting signals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">RE-ENTRY SIGNALS</h2>
                        <p className="text-xs text-muted-foreground">Time-Filtered Opportunities</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-xs text-cyan-400 font-mono">{reEntrySignals.length} Signals</span>
                </div>
            </div>

            {/* Signal List */}
            <div className="space-y-2">
                {reEntrySignals.map((signal, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${signal.confirmed
                                ? signal.type === "call"
                                    ? "bg-bullish/5 border-bullish/30"
                                    : "bg-bearish/5 border-bearish/30"
                                : "bg-secondary/30 border-border/50"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Signal Type Arrow */}
                            {signal.type === "call" ? (
                                <div className="w-10 h-10 rounded-lg bg-bullish/20 flex items-center justify-center">
                                    <ArrowUpCircle className="w-5 h-5 text-bullish" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-bearish/20 flex items-center justify-center">
                                    <ArrowDownCircle className="w-5 h-5 text-bearish" />
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${signal.type === "call" ? "text-bullish" : "text-bearish"}`}>
                                        {signal.type === "call" ? "BUY CALL" : "BUY PUT"}
                                    </span>
                                    {signal.confirmed ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400">
                                            <CheckCircle className="w-3 h-3" />
                                            Confirmed
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-400">
                                            <Clock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    VWAP Retest + STR Confirmation
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {signal.time}
                            </div>
                            <p className="font-mono font-bold text-sm mt-0.5">
                                {signal.price.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Signal Logic */}
            <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2">Signal Logic:</p>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-muted-foreground">Price retests VWAP level</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-muted-foreground">STR confirms direction bias</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-muted-foreground">Time filter validates entry</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReEntrySignals;
