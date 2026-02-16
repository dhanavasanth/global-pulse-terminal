import { useAutoTrade } from "@/contexts/AutoTradeContext";

export const SentimentGauge = () => {
    const { latestCycle } = useAutoTrade();
    const sentimentScore = latestCycle?.sentiment?.score ?? 0;
    const sentimentLabel = latestCycle?.sentiment?.label ?? "neutral";

    // Map score (-1 to 1) to rotation (-90 to 90 degrees)
    const rotation = sentimentScore * 90;

    const gaugeColor = sentimentScore > 0.2
        ? "#34d399"
        : sentimentScore < -0.2
            ? "#f87171"
            : "#fbbf24";

    const labelColor = sentimentScore > 0.2
        ? "text-emerald-400"
        : sentimentScore < -0.2
            ? "text-rose-400"
            : "text-amber-400";

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-base">💭</span>
                <h3 className="text-sm font-semibold text-white">Market Sentiment</h3>
            </div>

            {/* Gauge */}
            <div className="flex justify-center mb-3">
                <div className="relative w-40 h-24 overflow-hidden">
                    {/* Background arc */}
                    <svg viewBox="0 0 200 110" className="w-full">
                        {/* Gradient arc segments */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 100 20"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="12"
                            strokeLinecap="round"
                            opacity="0.3"
                        />
                        <path
                            d="M 100 20 A 80 80 0 0 1 120 22"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="12"
                            strokeLinecap="round"
                            opacity="0.3"
                        />
                        <path
                            d="M 80 22 A 80 80 0 0 0 100 20"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="12"
                            strokeLinecap="round"
                            opacity="0.3"
                        />
                        <path
                            d="M 120 22 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeLinecap="round"
                            opacity="0.3"
                        />

                        {/* Needle */}
                        <g transform={`rotate(${rotation}, 100, 100)`}>
                            <line
                                x1="100"
                                y1="100"
                                x2="100"
                                y2="30"
                                stroke={gaugeColor}
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                            <circle cx="100" cy="100" r="6" fill={gaugeColor} />
                            <circle cx="100" cy="100" r="3" fill="#000" />
                        </g>

                        {/* Labels */}
                        <text x="15" y="108" fill="#ef4444" fontSize="10" fontWeight="600">Bear</text>
                        <text x="90" y="16" fill="#fbbf24" fontSize="10" fontWeight="600">N</text>
                        <text x="165" y="108" fill="#22c55e" fontSize="10" fontWeight="600">Bull</text>
                    </svg>
                </div>
            </div>

            {/* Score Display */}
            <div className="text-center">
                <div className={`text-2xl font-bold ${labelColor}`}>
                    {sentimentScore >= 0 ? "+" : ""}{sentimentScore.toFixed(2)}
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
                    {sentimentLabel}
                </div>
            </div>

            {/* Sentiment Breakdown Bar */}
            <div className="mt-3 flex rounded-full overflow-hidden h-1.5 bg-white/5">
                <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, (1 - sentimentScore) * 50)}%` }}
                />
                <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: "10%" }}
                />
                <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, (1 + sentimentScore) * 50)}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>Bearish</span>
                <span>Bullish</span>
            </div>
        </div>
    );
};
