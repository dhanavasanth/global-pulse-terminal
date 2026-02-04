import { useOrderFlow } from "@/contexts/OrderFlowContext";

const DeltaPanel = () => {
    const { candles } = useOrderFlow();

    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return null;

    const totalSessionVol = candles.reduce((acc, c) => acc + c.volume, 0);
    const totalSessionDelta = candles.reduce((acc, c) => acc + c.delta, 0);
    const cvd = lastCandle.cumDelta;

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
                {/* Key Metrics */}
                <div className="space-y-2 p-2 rounded-lg bg-black/20">
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono text-sm">{totalSessionVol.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-muted-foreground">Delta</span>
                        <span className={`font-mono text-sm ${totalSessionDelta > 0 ? 'text-bullish' : 'text-bearish'}`}>
                            {totalSessionDelta > 0 ? '+' : ''}{totalSessionDelta.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-muted-foreground">CVD</span>
                        <span className={`font-mono text-sm ${cvd > 0 ? 'text-primary' : 'text-orange-500'}`}>
                            {cvd > 0 ? '+' : ''}{cvd.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Delta Bar Chart (Mini) */}
                <div className="mt-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-bold">Delta History</p>
                    <div className="h-24 flex items-center gap-1 justify-end border-b border-border/30 pb-1">
                        {candles.slice(-15).map((c, i) => {
                            const maxDelta = Math.max(...candles.map(x => Math.abs(x.delta)), 1);
                            const height = Math.abs(c.delta) / maxDelta * 100;

                            return (
                                <div key={i} className="flex-1 flex flex-col justify-center h-full group relative">
                                    <div
                                        className={`w-full rounded-sm min-h-[2px] opacity-70 group-hover:opacity-100 transition-all ${c.delta > 0 ? 'bg-bullish' : 'bg-bearish'}`}
                                        style={{ height: `${height * 0.8}%` }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeltaPanel;
