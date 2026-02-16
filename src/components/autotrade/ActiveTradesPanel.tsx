import { Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAutoTrade } from "@/contexts/AutoTradeContext";

export const ActiveTradesPanel = () => {
    const { latestCycle } = useAutoTrade();
    const topActive = latestCycle?.active_trades?.top || [];
    const pcr = latestCycle?.active_trades?.pcr || {};

    // Sample data when no cycle results yet
    const displayData = topActive.length > 0 ? topActive : [
        { strike: 25000, type: "CE", index: "nifty50", oi: 185000, volume: 92000, activity_score: 2.1, activity_label: "high", comparison: "2.1x avg OI" },
        { strike: 25100, type: "PE", index: "nifty50", oi: 142000, volume: 68000, activity_score: 1.8, activity_label: "high", comparison: "1.8x avg OI" },
        { strike: 53000, type: "CE", index: "banknifty", oi: 95000, volume: 55000, activity_score: 1.7, activity_label: "high", comparison: "1.7x avg OI" },
        { strike: 24900, type: "CE", index: "nifty50", oi: 78000, volume: 41000, activity_score: 1.5, activity_label: "high", comparison: "1.5x avg OI" },
        { strike: 25200, type: "PE", index: "nifty50", oi: 68000, volume: 35000, activity_score: 1.4, activity_label: "medium", comparison: "1.4x avg OI" },
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Hot Options</h3>
                <span className="ml-auto text-[10px] text-zinc-500">OI + Volume</span>
            </div>

            {/* PCR Summary */}
            <div className="flex gap-2 mb-3">
                {Object.entries(pcr).length > 0
                    ? Object.entries(pcr).map(([idx, data]: [string, any]) => (
                        <div key={idx} className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-center">
                            <div className="text-[10px] uppercase text-zinc-500">{idx} PCR</div>
                            <div className={`text-sm font-bold ${data?.signal === "bullish" ? "text-emerald-400" :
                                    data?.signal === "bearish" ? "text-rose-400" : "text-zinc-300"
                                }`}>
                                {data?.oi_pcr?.toFixed(2) || "—"}
                            </div>
                        </div>
                    ))
                    : ["Nifty", "BankNifty"].map((idx) => (
                        <div key={idx} className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-center">
                            <div className="text-[10px] uppercase text-zinc-500">{idx} PCR</div>
                            <div className="text-sm font-bold text-zinc-300">0.95</div>
                        </div>
                    ))
                }
            </div>

            {/* Active Options Table */}
            <div className="space-y-1">
                <div className="grid grid-cols-12 gap-1 text-[10px] text-zinc-500 font-medium px-2 pb-1">
                    <div className="col-span-2">Strike</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3 text-right">OI</div>
                    <div className="col-span-3 text-right">Volume</div>
                    <div className="col-span-2 text-right">Score</div>
                </div>

                {displayData.map((opt: any, i: number) => {
                    const isCall = opt.type === "CE";
                    const scoreColor = opt.activity_score > 1.5
                        ? "text-orange-400"
                        : opt.activity_score > 1.0
                            ? "text-amber-400"
                            : "text-zinc-400";

                    return (
                        <div
                            key={`${opt.strike}-${opt.type}-${i}`}
                            className="grid grid-cols-12 gap-1 text-xs items-center rounded-lg px-2 py-1.5 hover:bg-white/5 transition-all group"
                        >
                            <div className="col-span-2 font-mono text-white/90">{opt.strike}</div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isCall
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-rose-500/20 text-rose-400"
                                    }`}>
                                    {isCall ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                                    {opt.type}
                                </span>
                            </div>
                            <div className="col-span-3 text-right font-mono text-zinc-300">
                                {(opt.oi / 1000).toFixed(0)}K
                            </div>
                            <div className="col-span-3 text-right font-mono text-zinc-300">
                                {(opt.volume / 1000).toFixed(0)}K
                            </div>
                            <div className={`col-span-2 text-right font-bold ${scoreColor}`}>
                                {opt.activity_score.toFixed(1)}x
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
