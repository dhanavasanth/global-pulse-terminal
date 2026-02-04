import { useOptions } from "@/contexts/OptionsContext";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";

const STRIndicator = () => {
    const { strData, isLoading, optionsChain } = useOptions();

    if (isLoading || strData.length === 0) {
        return (
            <div className="glass-card p-4 lg:p-5 h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bullish/20 to-bearish/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">STR INDICATOR</h2>
                        <p className="text-xs text-muted-foreground">Directional Engine</p>
                    </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Click "Fetch Full Chart" to load data</p>
                </div>
            </div>
        );
    }

    const latestSTR = strData[strData.length - 1];
    const callDominant = latestSTR.callStrength > latestSTR.putStrength;
    const callAboveZero = latestSTR.callStrength > 50;
    const putAboveZero = latestSTR.putStrength > 50;

    // Calculate chart dimensions
    const chartHeight = 200;
    const chartWidth = 100; // percentage
    const maxValue = 100;
    const minValue = 0;
    const range = maxValue - minValue;

    const getY = (value: number) => {
        const val = Number.isFinite(value) ? value : 0;
        return chartHeight - ((val - minValue) / range) * chartHeight;
    };

    // Generate SVG paths with safe values
    const callPath = strData.map((d, i) => {
        const x = strData.length > 1 ? (i / (strData.length - 1)) * 100 : 50;
        const y = getY(d.callStrength);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const putPath = strData.map((d, i) => {
        const x = strData.length > 1 ? (i / (strData.length - 1)) * 100 : 50;
        const y = getY(d.putStrength);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const callVWAPPath = strData.map((d, i) => {
        const x = strData.length > 1 ? (i / (strData.length - 1)) * 100 : 50;
        const y = getY((d.callVWAP / 300) * 100);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const putVWAPPath = strData.map((d, i) => {
        const x = strData.length > 1 ? (i / (strData.length - 1)) * 100 : 50;
        const y = getY((d.putVWAP / 300) * 100);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bullish/20 to-bearish/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">STR INDICATOR</h2>
                        <p className="text-[10px] text-muted-foreground">Call vs Put Directional Engine</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${callDominant ? "bg-bullish/10 border border-bullish/30" : "bg-bearish/10 border border-bearish/30"
                    }`}>
                    {callDominant ? (
                        <TrendingUp className="w-3.5 h-3.5 text-bullish" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-bearish" />
                    )}
                    <span className={`text-[10px] font-medium ${callDominant ? "text-bullish" : "text-bearish"}`}>
                        {callDominant ? "CALL DOMINANT" : "PUT DOMINANT"}
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="relative h-40 bg-secondary/20 rounded-lg border border-border/50 overflow-hidden">
                {/* Zero Line */}
                <div
                    className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/30"
                    style={{ top: '50%' }}
                >
                    <span className="absolute -left-1 -top-2.5 text-[10px] text-muted-foreground bg-background px-1">0</span>
                </div>

                {/* Chart SVG */}
                <svg
                    className="w-full h-full"
                    viewBox={`0 0 100 ${chartHeight}`}
                    preserveAspectRatio="none"
                >
                    {/* Call Strength Line (Green) */}
                    <path
                        d={callPath}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Put Strength Line (Red) */}
                    <path
                        d={putPath}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Call VWAP (Solid Green) */}
                    <path
                        d={callVWAPPath}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1"
                        strokeOpacity="0.5"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Put VWAP (Solid Red) */}
                    <path
                        d={putVWAPPath}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1"
                        strokeOpacity="0.5"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* Current Values Overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 bg-background/80 rounded px-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-bullish" />
                        <span className="text-[10px] font-mono text-bullish">
                            CE: {latestSTR.callStrength.toFixed(1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-background/80 rounded px-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-bearish" />
                        <span className="text-[10px] font-mono text-bearish">
                            PE: {latestSTR.putStrength.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-0.5 bg-bullish" />
                        <span className="text-muted-foreground">Call Strength</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-0.5 bg-bearish" />
                        <span className="text-muted-foreground">Put Strength</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {callAboveZero && (
                        <span className="px-2 py-0.5 rounded bg-bullish/10 text-bullish text-[10px]">
                            CE Above Zero → Buy Call Bias
                        </span>
                    )}
                    {putAboveZero && (
                        <span className="px-2 py-0.5 rounded bg-bearish/10 text-bearish text-[10px]">
                            PE Above Zero → Buy Put Bias
                        </span>
                    )}
                </div>
            </div>

            {/* VWAP & POC Info */}
            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-4 text-xs">
                <div>
                    <p className="text-muted-foreground mb-1">Call Levels</p>
                    <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-bullish" />
                        <span className="text-muted-foreground">VWAP:</span>
                        <span className="font-mono text-bullish">{latestSTR.callVWAP.toFixed(2)}</span>
                        <span className="text-muted-foreground">POC:</span>
                        <span className="font-mono text-bullish/70">{latestSTR.callPOC.toFixed(2)}</span>
                    </div>
                </div>
                <div>
                    <p className="text-muted-foreground mb-1">Put Levels</p>
                    <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-bearish" />
                        <span className="text-muted-foreground">VWAP:</span>
                        <span className="font-mono text-bearish">{latestSTR.putVWAP.toFixed(2)}</span>
                        <span className="text-muted-foreground">POC:</span>
                        <span className="font-mono text-bearish/70">{latestSTR.putPOC.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default STRIndicator;
