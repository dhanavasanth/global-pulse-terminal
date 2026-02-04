import { useChart } from "@/contexts/ChartContext";
import { Target, TrendingUp, X, Sparkles } from "lucide-react";

const SelectedSymbolBanner = () => {
    const { selectedSymbol, symbolName, setSelectedSymbol, setSymbolName } = useChart();

    // Parse exchange and symbol from the selectedSymbol (e.g., "NASDAQ:AAPL")
    const parts = selectedSymbol.split(":");
    const exchange = parts[0] || "";
    const symbol = parts[1] || selectedSymbol;

    const handleReset = () => {
        setSelectedSymbol("NASDAQ:AAPL");
        setSymbolName("Apple Inc.");
    };

    return (
        <div className="glass-card border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-3 lg:p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Currently Analyzing</span>
                                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xl font-bold text-primary font-mono">{symbol}</span>
                                <span className="px-2 py-0.5 rounded-md bg-secondary/50 text-xs font-medium text-muted-foreground">
                                    {exchange}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block h-10 w-px bg-border/50" />

                    <div className="hidden md:block">
                        <p className="text-sm font-medium">{symbolName}</p>
                        <p className="text-xs text-muted-foreground">
                            All widgets synced to this symbol
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-bullish/10 text-bullish">
                            <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                            <span>Chart</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Technical</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>Info</span>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-3 h-3" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                    💡 <span className="text-foreground/70">Tip:</span> Click any instrument from Indices, Forex, Crypto, Commodities, Top Movers, or Crypto Overview to analyze it. All widgets will update automatically.
                </p>
            </div>
        </div>
    );
};

export default SelectedSymbolBanner;
