import { useOptions } from "@/contexts/OptionsContext";
import { Zap, AlertTriangle, Target, Flame } from "lucide-react";

const XRPIndicator = () => {
    const { straddleData, isLoading, spotPrice, atmStrike } = useOptions();

    if (isLoading || straddleData.length === 0) {
        return (
            <div className="glass-card p-4 lg:p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">XRP INDICATOR</h2>
                        <p className="text-xs text-muted-foreground">Extreme Price Zones</p>
                    </div>
                </div>
                <div className="h-40 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Awaiting data...</p>
                </div>
            </div>
        );
    }

    const prices = straddleData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const latestPrice = prices[prices.length - 1];

    // Detect extreme zones
    const percentileThreshold = 0.15; // Bottom 15%
    const extremeThreshold = minPrice + (maxPrice - minPrice) * percentileThreshold;
    const isInExtremeZone = latestPrice <= extremeThreshold;
    const isHeroZeroSetup = isInExtremeZone && latestPrice < avgPrice * 0.85;

    // Calculate zone levels
    const heroZeroZone = minPrice * 1.05;
    const demandZone = avgPrice * 0.9;

    return (
        <div className="glass-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">XRP INDICATOR</h2>
                        <p className="text-xs text-muted-foreground">Extreme Price Zones</p>
                    </div>
                </div>
                {isHeroZeroSetup && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 animate-pulse">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-orange-400">HERO/ZERO SETUP!</span>
                    </div>
                )}
            </div>

            {/* Extreme Zone Visualization */}
            <div className="relative h-32 bg-gradient-to-b from-bearish/10 via-transparent to-bullish/10 rounded-lg border border-border/50 overflow-hidden">
                {/* Zone Bands */}
                <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1 border-b border-bearish/20 flex items-center px-3">
                        <span className="text-[10px] text-bearish/70">Extreme High</span>
                    </div>
                    <div className="flex-1 border-b border-muted-foreground/20 flex items-center px-3">
                        <span className="text-[10px] text-muted-foreground/70">Normal Range</span>
                    </div>
                    <div className="flex-1 flex items-center px-3">
                        <span className="text-[10px] text-orange-400">Hero/Zero Zone</span>
                    </div>
                </div>

                {/* Current Price Marker */}
                <div
                    className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 z-10"
                    style={{
                        top: `${Math.max(10, Math.min(90, ((maxPrice - latestPrice) / (maxPrice - minPrice)) * 100))}%`
                    }}
                />

                {/* Price Line */}
                <div
                    className="absolute left-1/4 right-1/4 h-0.5 bg-primary/50"
                    style={{
                        top: `${Math.max(10, Math.min(90, ((maxPrice - latestPrice) / (maxPrice - minPrice)) * 100))}%`
                    }}
                />
            </div>

            {/* Stats Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Current</p>
                    <p className="font-mono font-bold text-sm text-primary">{latestPrice.toFixed(2)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Day Low</p>
                    <p className="font-mono font-bold text-sm text-orange-400">{minPrice.toFixed(2)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Day High</p>
                    <p className="font-mono font-bold text-sm text-bearish">{maxPrice.toFixed(2)}</p>
                </div>
            </div>

            {/* Zone Status */}
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-orange-400" />
                        <span className="text-muted-foreground">Hero/Zero Zone:</span>
                    </div>
                    <span className="font-mono text-orange-400">≤ {heroZeroZone.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        <span className="text-muted-foreground">Demand Zone:</span>
                    </div>
                    <span className="font-mono text-yellow-400">≤ {demandZone.toFixed(2)}</span>
                </div>
            </div>

            {/* Alert Box */}
            {isInExtremeZone && (
                <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30">
                    <p className="text-xs text-orange-400">
                        ⚡ <strong>Extreme Low Detected!</strong> Straddle at zero-demand levels.
                        Potential explosive move incoming!
                    </p>
                </div>
            )}
        </div>
    );
};

export default XRPIndicator;
