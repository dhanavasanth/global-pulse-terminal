import { useOptions } from "@/contexts/OptionsContext";
import {
    Brain, TrendingUp, TrendingDown, Target, Shield,
    Gauge, Zap, BarChart3, ArrowRight
} from "lucide-react";

const AIInsightPanel = () => {
    const { aiInsight, isLoading, selectedIndex, atmStrike, spotPrice } = useOptions();

    if (isLoading) {
        return (
            <div className="glass-card p-4 lg:p-5 bg-gradient-to-br from-primary/5 to-cyan-500/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">AI INSIGHT</h2>
                        <p className="text-xs text-muted-foreground">Smart Analysis</p>
                    </div>
                </div>
                <div className="h-40 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-primary">
                        <Brain className="w-5 h-5 animate-pulse" />
                        <span className="text-sm">Analyzing market data...</span>
                    </div>
                </div>
            </div>
        );
    }

    const isBullish = aiInsight.bias === "Bullish";

    return (
        <div className="glass-card p-4 lg:p-5 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 border-primary/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">AI INSIGHT</h2>
                        <p className="text-xs text-muted-foreground">ThinnAIQ Smart Analysis</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/30">
                        <Gauge className="w-3 h-3 text-primary" />
                        <span className="text-xs font-mono text-primary">{aiInsight.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* Main Bias Display */}
            <div className={`p-4 rounded-xl mb-4 ${isBullish
                    ? "bg-gradient-to-r from-bullish/10 to-bullish/5 border border-bullish/30"
                    : "bg-gradient-to-r from-bearish/10 to-bearish/5 border border-bearish/30"
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isBullish ? (
                            <TrendingUp className="w-8 h-8 text-bullish" />
                        ) : (
                            <TrendingDown className="w-8 h-8 text-bearish" />
                        )}
                        <div>
                            <p className="text-lg font-bold text-foreground">{aiInsight.bias.toUpperCase()}</p>
                            <p className="text-xs text-muted-foreground">{aiInsight.direction}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Market State</p>
                        <p className={`font-medium ${aiInsight.marketState === "Trending" ? "text-primary" : "text-yellow-400"
                            }`}>
                            {aiInsight.marketState}
                        </p>
                    </div>
                </div>
            </div>

            {/* Trading Levels */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Shield className="w-3 h-3 text-bearish" />
                        <span className="text-[10px] text-muted-foreground uppercase">Stop Loss</span>
                    </div>
                    <p className="font-mono font-bold text-bearish">{aiInsight.stopLoss.toLocaleString()}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-3 h-3 text-bullish" />
                        <span className="text-[10px] text-muted-foreground uppercase">Target 1</span>
                    </div>
                    <p className="font-mono font-bold text-bullish">{aiInsight.target1.toLocaleString()}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase">Target 2</span>
                    </div>
                    <p className="font-mono font-bold text-primary">{aiInsight.target2.toLocaleString()}</p>
                </div>
            </div>

            {/* AI Summary */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-cyan-500/5 border border-primary/20">
                <div className="flex items-start gap-2">
                    <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                        <p className="text-foreground">
                            <strong className="text-primary">{selectedIndex}</strong> showing{" "}
                            <strong className={isBullish ? "text-bullish" : "text-bearish"}>
                                {aiInsight.bias.toLowerCase()}
                            </strong>{" "}
                            bias with{" "}
                            <strong className={aiInsight.marketState === "Trending" ? "text-primary" : "text-yellow-400"}>
                                {aiInsight.marketState.toLowerCase()}
                            </strong>{" "}
                            market conditions.
                        </p>
                        <p className="text-muted-foreground mt-1">
                            {isBullish
                                ? `Consider buying ${atmStrike} CE above ${spotPrice.toFixed(0)} with SL at ${aiInsight.stopLoss}`
                                : `Consider buying ${atmStrike} PE below ${spotPrice.toFixed(0)} with SL at ${aiInsight.stopLoss}`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    <span>Spot: <span className="text-foreground font-mono">{spotPrice.toFixed(2)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <span>ATM: <span className="text-foreground font-mono">{atmStrike}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Confidence: <span className="text-primary font-mono">{aiInsight.confidence}%</span></span>
                </div>
            </div>
        </div>
    );
};

export default AIInsightPanel;
