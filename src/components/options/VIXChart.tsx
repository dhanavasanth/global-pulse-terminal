import { useOptions } from "@/contexts/OptionsContext";
import { Activity, TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";

const VIXChart = () => {
    const { vixData, isLoading } = useOptions();

    if (isLoading || vixData.length === 0) {
        return (
            <div className="glass-card p-4 lg:p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">INDIA VIX</h2>
                        <p className="text-xs text-muted-foreground">Volatility Sync</p>
                    </div>
                </div>
                <div className="h-40 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Awaiting data...</p>
                </div>
            </div>
        );
    }

    const latestVIX = vixData[vixData.length - 1];
    const dayHigh = Math.max(...vixData.map(d => d.value));
    const dayLow = Math.min(...vixData.map(d => d.value));
    const isCompression = latestVIX.value < 13;
    const isExpansion = latestVIX.value > 18;

    const chartHeight = 100;
    const range = dayHigh - dayLow || 1;

    // Safe Y mapping with clamping to prevent out-of-bounds coordinates
    const getY = (value: number) => {
        const y = chartHeight - ((value - dayLow) / range) * chartHeight;
        // Allow y to go outside 0-100 for line paths, but we need careful handling for rects
        return y;
    };

    // Calculate zone boundaries safely
    const y13 = getY(13);
    const y18 = getY(18);

    // Compression Zone (<13): From y13 down to bottom (chartHeight). 
    // If y13 > chartHeight (13 is below current range), start at chartHeight (height 0).
    // If y13 < 0 (13 is above current range), start at 0 (full height).
    const compY = Math.max(0, Math.min(chartHeight, y13));
    const compHeight = Math.max(0, chartHeight - compY);

    // Expansion Zone (>18): From top (0) down to y18.
    // If y18 < 0 (18 is above current range), end at 0 (height 0).
    // If y18 > chartHeight (18 is below current range), end at chartHeight (full height).
    const expHeight = Math.max(0, Math.min(chartHeight, y18));

    const vixPath = vixData.map((d, i) => {
        const x = vixData.length > 1
            ? (i / (vixData.length - 1)) * 100
            : 50; // Center if single point
        const rawY = getY(d.value);
        const safeY = Number.isFinite(rawY) ? rawY : chartHeight / 2; // Fallback for NaN
        return `${i === 0 ? 'M' : 'L'} ${x} ${safeY}`;
    }).join(' ');

    // Area fill
    const areaPath = vixPath + ` L 100 ${chartHeight} L 0 ${chartHeight} Z`;

    return (
        <div className="glass-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">INDIA VIX</h2>
                        <p className="text-xs text-muted-foreground">Volatility Synchronization</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isCompression
                    ? "bg-green-500/10 border border-green-500/30"
                    : isExpansion
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-purple-500/10 border border-purple-500/30"
                    }`}>
                    {isCompression ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : isExpansion ? (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : (
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                    )}
                    <span className={`text-xs font-medium ${isCompression ? "text-green-500" : isExpansion ? "text-red-400" : "text-purple-500"
                        }`}>
                        {isCompression ? "COMPRESSION" : isExpansion ? "EXPANSION" : "NORMAL"}
                    </span>
                </div>
            </div>

            {/* VIX Value Display */}
            <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                    <p className="text-4xl font-bold font-mono text-purple-400">
                        {latestVIX.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Current VIX</p>
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-24 bg-secondary/20 rounded-lg border border-border/50 overflow-hidden">
                <svg
                    className="w-full h-full"
                    viewBox={`0 0 100 ${chartHeight}`}
                    preserveAspectRatio="none"
                >
                    {/* Compression Zone */}
                    <rect
                        x="0"
                        y={compY}
                        width="100%"
                        height={compHeight}
                        fill="#22c55e"
                        fillOpacity="0.1"
                    />

                    {/* Expansion Zone */}
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height={expHeight}
                        fill="#ef4444"
                        fillOpacity="0.1"
                    />


                    {/* Area Fill */}
                    <path
                        d={areaPath}
                        fill="url(#vixGradient)"
                    />

                    {/* VIX Line */}
                    <path
                        d={vixPath}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="vixGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Zone Labels */}
                <div className="absolute top-1 right-2 text-[9px] text-red-400/70">Expansion &gt;18</div>
                <div className="absolute bottom-1 right-2 text-[9px] text-green-400/70">Compression &lt;13</div>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Day Low</p>
                    <p className="font-mono font-bold text-sm text-green-400">{dayLow.toFixed(2)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Current</p>
                    <p className="font-mono font-bold text-sm text-purple-400">{latestVIX.value.toFixed(2)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Day High</p>
                    <p className="font-mono font-bold text-sm text-red-400">{dayHigh.toFixed(2)}</p>
                </div>
            </div>

            {/* Interpretation */}
            <div className="mt-3 pt-3 border-t border-border/50">
                {isCompression ? (
                    <div className="p-2 rounded-lg bg-green-500/10 text-xs text-green-400">
                        <Zap className="w-3 h-3 inline mr-1" />
                        <strong>Low VIX Compression:</strong> Breakout probability HIGH! Watch for XRP extreme zones.
                    </div>
                ) : isExpansion ? (
                    <div className="p-2 rounded-lg bg-red-500/10 text-xs text-red-400">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        <strong>VIX Expansion:</strong> High volatility mode. Wide moves expected. Hedge positions.
                    </div>
                ) : (
                    <div className="p-2 rounded-lg bg-purple-500/10 text-xs text-purple-400">
                        <BarChart3 className="w-3 h-3 inline mr-1" />
                        <strong>Normal Range:</strong> Standard volatility. Follow STR for direction.
                    </div>
                )}
            </div>
        </div>
    );
};

export default VIXChart;
