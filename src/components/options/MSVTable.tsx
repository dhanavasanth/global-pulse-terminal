import { useOptions } from "@/contexts/OptionsContext";
import { TableProperties, TrendingUp, TrendingDown, Minus, Shield, Target } from "lucide-react";

const MSVTable = () => {
    const { msvData, isLoading, atmStrike, selectedIndex } = useOptions();

    if (isLoading || msvData.length === 0) {
        return (
            <div className="glass-card p-4 lg:p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <TableProperties className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">MSV TABLE</h2>
                        <p className="text-xs text-muted-foreground">Market Sentiment View</p>
                    </div>
                </div>
                <div className="h-48 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Awaiting data...</p>
                </div>
            </div>
        );
    }

    const getBiasIcon = (bias: "bullish" | "bearish") => {
        return bias === "bullish" ? (
            <TrendingUp className="w-4 h-4 text-bullish" />
        ) : (
            <TrendingDown className="w-4 h-4 text-bearish" />
        );
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case "Bull": return "text-bullish bg-bullish/10";
            case "Bear": return "text-bearish bg-bearish/10";
            case "Sideways": return "text-yellow-400 bg-yellow-400/10";
            case "Volatile": return "text-purple-400 bg-purple-400/10";
            default: return "text-muted-foreground bg-muted/10";
        }
    };

    const getStateIcon = (state: string) => {
        switch (state) {
            case "Bull": return <TrendingUp className="w-3 h-3" />;
            case "Bear": return <TrendingDown className="w-3 h-3" />;
            case "Sideways": return <Minus className="w-3 h-3" />;
            case "Volatile": return "⚡";
            default: return null;
        }
    };

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <TableProperties className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">MSV TABLE</h2>
                        <p className="text-xs text-muted-foreground">5 Strikes Around ATM ({atmStrike})</p>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    {selectedIndex}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="py-2 px-2 text-left text-muted-foreground font-medium">Strike</th>
                            <th className="py-2 px-2 text-center text-muted-foreground font-medium">Call Bias</th>
                            <th className="py-2 px-2 text-center text-muted-foreground font-medium">Put Bias</th>
                            <th className="py-2 px-2 text-center text-muted-foreground font-medium">Market State</th>
                            <th className="py-2 px-2 text-center text-muted-foreground font-medium">Zone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {msvData.map((entry, index) => {
                            const isATM = entry.strike === atmStrike;
                            return (
                                <tr
                                    key={entry.strike}
                                    className={`border-b border-border/30 transition-colors hover:bg-secondary/30 ${isATM ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold ${isATM ? "text-primary" : ""}`}>
                                                {entry.strike}
                                            </span>
                                            {isATM && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary">
                                                    ATM
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex justify-center">
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded ${entry.callBias === "bullish" ? "bg-bullish/10" : "bg-bearish/10"
                                                }`}>
                                                {getBiasIcon(entry.callBias)}
                                                <span className={entry.callBias === "bullish" ? "text-bullish" : "text-bearish"}>
                                                    {entry.callBias === "bullish" ? "Green" : "Red"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex justify-center">
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded ${entry.putBias === "bullish" ? "bg-bullish/10" : "bg-bearish/10"
                                                }`}>
                                                {getBiasIcon(entry.putBias)}
                                                <span className={entry.putBias === "bullish" ? "text-bullish" : "text-bearish"}>
                                                    {entry.putBias === "bullish" ? "Green" : "Red"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex justify-center">
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded font-medium ${getStateColor(entry.marketState)}`}>
                                                {getStateIcon(entry.marketState)}
                                                {entry.marketState}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex justify-center">
                                            {entry.isSupport && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded bg-bullish/10 text-bullish">
                                                    <Shield className="w-3 h-3" />
                                                    Support
                                                </span>
                                            )}
                                            {entry.isResistance && (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded bg-bearish/10 text-bearish">
                                                    <Target className="w-3 h-3" />
                                                    Resistance
                                                </span>
                                            )}
                                            {!entry.isSupport && !entry.isResistance && (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground mb-2">Interpretation Rules:</p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-bullish" />
                        <span className="text-muted-foreground">Call Green + Put Red = Bull</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-bearish" />
                        <span className="text-muted-foreground">Put Green + Call Red = Bear</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-muted-foreground">Both Green = Volatile</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-muted-foreground">Both Red = Sideways</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MSVTable;
