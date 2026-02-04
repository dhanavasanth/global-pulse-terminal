import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";

const data = [
    { time: "09:00", sentiment: 2.5, label: "Strong Bullish" },
    { time: "09:15", sentiment: 2.8, label: "Strong Bullish" },
    { time: "09:30", sentiment: 2.2, label: "Mild Bullish" },
    { time: "09:45", sentiment: 1.5, label: "Mild Bullish" },
    { time: "10:00", sentiment: 0.8, label: "Neutral" },
    { time: "10:15", sentiment: 0.2, label: "Neutral" },
    { time: "10:30", sentiment: -0.5, label: "Neutral" },
    { time: "10:45", sentiment: -1.2, label: "Mild Bearish" },
    { time: "11:00", sentiment: -1.8, label: "Bearish" },
    { time: "11:15", sentiment: -2.2, label: "Strong Bearish" },
    { time: "11:30", sentiment: -1.5, label: "Bearish" },
    { time: "11:45", sentiment: -0.8, label: "Neutral" },
    { time: "12:00", sentiment: 0.5, label: "Neutral" },
    { time: "12:15", sentiment: 1.2, label: "Mild Bullish" },
    { time: "12:30", sentiment: 1.8, label: "Mild Bullish" },
    { time: "12:45", sentiment: 2.1, label: "Strong Bullish" },
    { time: "13:00", sentiment: 1.5, label: "Mild Bullish" },
    { time: "13:15", sentiment: 0.8, label: "Neutral" },
    { time: "13:30", sentiment: 0.2, label: "Neutral" },
    { time: "13:45", sentiment: -0.5, label: "Neutral" },
    { time: "14:00", sentiment: -1.0, label: "Mild Bearish" },
];

const gradientOffset = () => {
    const dataMax = Math.max(...data.map((i) => i.sentiment));
    const dataMin = Math.min(...data.map((i) => i.sentiment));

    if (dataMax <= 0) {
        return 0;
    }
    if (dataMin >= 0) {
        return 1;
    }

    return dataMax / (dataMax - dataMin);
};

const off = gradientOffset();

export const SentimentTrendChart = () => {
    return (
        <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold tracking-wide flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary rounded-full"></span>
                        Sentiment Trend
                    </h3>
                    <p className="text-xs text-muted-foreground ml-3">Intraday Bias Momentum (5-min intervals)</p>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1 text-[10px] items-end font-mono opacity-80">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Strong Bullish (+3)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Neutral (0)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Bearish (-3)</div>
                </div>
            </div>

            {/* Left Axis Labels Overlay */}
            <div className="absolute left-6 top-20 bottom-10 flex flex-col justify-between text-[10px] font-bold text-muted-foreground/50 pointer-events-none z-10">
                <span className="text-green-500">Strong Bullish</span>
                <span className="text-yellow-500">Neutral</span>
                <span className="text-red-500">Bearish</span>
            </div>

            <div className="flex-1 w-full min-h-[250px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset={off} stopColor="#ef4444" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                <stop offset={off} stopColor="#22c55e" stopOpacity={1} />
                                <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
                            stroke="#525252"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                            hide={true}
                            domain={[-3, 3]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            formatter={(value: number) => [value > 0 ? `+${value}` : value, 'Sentiment Score']}
                        />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />

                        <Area
                            type="monotone"
                            dataKey="sentiment"
                            stroke="url(#splitStroke)"
                            fill="url(#splitColor)"
                            strokeWidth={3}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
