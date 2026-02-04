import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface BiasGaugeProps {
    score: number | null;
    label: string;
}

export const BiasGauge = ({ score, label }: BiasGaugeProps) => {
    // Score is from -3 to +3 ideally. We map it to 0-100 for the gauge.
    // -3 -> 0 (Strong Bearish)
    // 0 -> 50 (Neutral)
    // +3 -> 100 (Strong Bullish)

    // Normalize score (-3 to 3) to angle (180 to 0)
    // Or just simple Pie chart sections

    // Simpler Approach for visualization:
    // A half-donut chart with needle? Or just color sections.

    // Let's use a simple semi-circle gauge approach.
    const normalizedScore = score ? Math.min(Math.max(score, -3), 3) : 0;

    // Gradient spectrum for gauge
    const data = [
        { name: "Bearish (Red)", value: 20, color: "#ef4444" },
        { name: "Mild Bearish (Orange)", value: 20, color: "#f97316" },
        { name: "Neutral (Yellow)", value: 20, color: "#eab308" },
        { name: "Mild Bullish (Lime)", value: 20, color: "#84cc16" },
        { name: "Bullish (Green)", value: 20, color: "#22c55e" },
    ];

    // Calculate needle rotation based on score (-3 to 3)
    // -3 -> 0 deg, +3 -> 180 deg
    // Formula: ((score + 3) / 6) * 180
    const rotation = ((normalizedScore + 3) / 6) * 180;

    return (
        <div className="w-full h-full min-h-[220px] relative flex flex-col items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={80}
                        outerRadius={130}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>

            {/* Needle */}
            <div
                className="absolute top-[70%] left-1/2 w-[6px] h-[100px] bg-slate-200 origin-bottom transform -translate-x-1/2 -translate-y-full z-10 rounded-t-full shadow-lg shadow-black/50"
                style={{ transform: `translateX(-50%) translateY(-100%) rotate(${rotation - 90}deg)` }}
            >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rounded-full border-2 border-slate-200"></div>
            </div>

            {/* Hub */}
            <div className="absolute top-[68%] left-1/2 w-12 h-6 rounded-t-full bg-slate-800 border-2 border-slate-600 -translate-x-1/2 flex items-center justify-center shadow-lg">
            </div>

            {/* Score Label overlay */}
            <div className="absolute bottom-6 flex flex-col items-center glass-card px-6 py-2 rounded-xl border-border/40 bg-background/60 backdrop-blur-md">
                <span className={`text-sm font-bold uppercase tracking-wider mb-1
                    ${normalizedScore > 0 ? "text-green-400" : normalizedScore < 0 ? "text-red-400" : "text-yellow-400"}`}>
                    {label || "Neutral"}
                </span>
                <span className="text-2xl font-black font-mono tracking-tighter text-foreground">
                    {score ? (score > 0 ? `+${score}` : score) : "0.0"} <span className="text-xs text-muted-foreground font-sans font-normal ml-1">Score</span>
                </span>
            </div>
        </div>
    );
};
