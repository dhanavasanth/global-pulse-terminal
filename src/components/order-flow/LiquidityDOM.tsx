import { useOrderFlow } from "@/contexts/OrderFlowContext";

const LiquidityDOM = () => {
    const { dom, lastPrice } = useOrderFlow();

    // Calculate max volume for heatmap intensity
    const maxVol = Math.max(...dom.flatMap(d => [d.bidLimit, d.askLimit]), 1);

    return (
        <div className="flex-1 bg-black/20 rounded-lg overflow-y-auto text-[10px] font-mono select-none">
            {/* Header */}
            <div className="sticky top-0 z-10 grid grid-cols-3 text-center py-1 bg-secondary/50 border-b border-border/30 text-muted-foreground">
                <div>Bid</div>
                <div>Price</div>
                <div>Ask</div>
            </div>

            <div className="py-1">
                {dom.map((level, i) => {
                    const isLastPrice = Math.abs(level.price - lastPrice) < 2.5; // Approx

                    return (
                        <div key={i} className={`grid grid-cols-3 text-center h-5 items-center hover:bg-secondary/20 transition-colors ${isLastPrice ? 'bg-primary/10' : ''}`}>
                            {/* Bid Side */}
                            <div className="relative h-full flex items-center justify-end px-2 border-r border-border/10">
                                {level.bidLimit > 0 && (
                                    <>
                                        {/* Heatmap Bar */}
                                        <div
                                            className="absolute right-0 top-0.5 bottom-0.5 bg-bullish/30 rounded-l-sm transition-all duration-300"
                                            style={{ width: `${(level.bidLimit / maxVol) * 100}%` }}
                                        />
                                        <span className="relative z-10 font-medium text-bullish">{level.bidLimit}</span>
                                    </>
                                )}
                            </div>

                            {/* Price Column */}
                            <div className={`relative px-1 font-bold ${isLastPrice ? 'text-primary bg-primary/20 rounded mx-1' : 'text-muted-foreground'}`}>
                                {level.price}
                            </div>

                            {/* Ask Side */}
                            <div className="relative h-full flex items-center justify-start px-2 border-l border-border/10">
                                {level.askLimit > 0 && (
                                    <>
                                        {/* Heatmap Bar */}
                                        <div
                                            className="absolute left-0 top-0.5 bottom-0.5 bg-bearish/30 rounded-r-sm transition-all duration-300"
                                            style={{ width: `${(level.askLimit / maxVol) * 100}%` }}
                                        />
                                        <span className="relative z-10 font-medium text-bearish">{level.askLimit}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LiquidityDOM;
