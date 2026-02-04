import { TrendingUp, Minus, TrendingDown } from "lucide-react";

interface SentimentCountsProps {
    positive: number;
    neutral: number;
    negative: number;
}

export const MarketSentimentCounts = ({ positive, neutral, negative }: SentimentCountsProps) => {
    return (
        <div className="glass-card p-4 flex flex-col h-full bg-secondary/10 border-border/50">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center justify-between">
                Market Sentiment
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Live</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 flex-1">
                {/* Positive */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xs font-semibold text-green-400 mb-1">Positive</span>
                    <span className="text-2xl font-bold font-mono text-green-500">{positive}</span>
                    <TrendingUp className="w-4 h-4 text-green-500/50 mt-1" />
                </div>

                {/* Neutral */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-xs font-semibold text-yellow-400 mb-1">Neutral</span>
                    <span className="text-2xl font-bold font-mono text-yellow-500">{neutral}</span>
                    <Minus className="w-4 h-4 text-yellow-500/50 mt-1" />
                </div>

                {/* Negative */}
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-xs font-semibold text-red-400 mb-1">Negative</span>
                    <span className="text-2xl font-bold font-mono text-red-500">{negative}</span>
                    <TrendingDown className="w-4 h-4 text-red-500/50 mt-1" />
                </div>
            </div>
        </div>
    );
};
