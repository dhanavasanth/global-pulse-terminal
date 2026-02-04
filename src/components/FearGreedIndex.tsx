import { useState, useEffect } from "react";
import { Gauge, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, Heart, BarChart3 } from "lucide-react";

interface SentimentData {
    value: number;
    label: string;
    color: string;
    description: string;
}

const FearGreedIndex = () => {
    const [sentiment, setSentiment] = useState<SentimentData>({
        value: 0,
        label: "Loading...",
        color: "text-muted-foreground",
        description: "Calculating market sentiment..."
    });
    const [isAnimating, setIsAnimating] = useState(false);

    // Simulated Fear & Greed calculation based on market factors
    // In production, you would use an actual API like Alternative.me for Crypto F&G
    const calculateSentiment = () => {
        // Simulate market sentiment (would normally come from API)
        const factors = {
            volatility: Math.random() * 100,
            momentum: Math.random() * 100,
            volume: Math.random() * 100,
            socialMedia: Math.random() * 100,
            dominance: Math.random() * 100,
        };

        const avgValue = Math.round(
            (factors.volatility + factors.momentum + factors.volume +
                factors.socialMedia + factors.dominance) / 5
        );

        return avgValue;
    };

    const getSentimentData = (value: number): SentimentData => {
        if (value <= 20) {
            return {
                value,
                label: "Extreme Fear",
                color: "text-red-500",
                description: "Investors are in extreme fear - potential buying opportunity"
            };
        } else if (value <= 40) {
            return {
                value,
                label: "Fear",
                color: "text-orange-500",
                description: "Market sentiment is fearful - caution advised"
            };
        } else if (value <= 60) {
            return {
                value,
                label: "Neutral",
                color: "text-yellow-500",
                description: "Market sentiment is balanced"
            };
        } else if (value <= 80) {
            return {
                value,
                label: "Greed",
                color: "text-lime-500",
                description: "Investors are getting greedy - be careful"
            };
        } else {
            return {
                value,
                label: "Extreme Greed",
                color: "text-green-500",
                description: "Extreme greed - correction may be coming"
            };
        }
    };

    useEffect(() => {
        const updateSentiment = () => {
            setIsAnimating(true);
            const value = calculateSentiment();
            setSentiment(getSentimentData(value));
            setTimeout(() => setIsAnimating(false), 500);
        };

        updateSentiment();
        const interval = setInterval(updateSentiment, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const gaugeRotation = (sentiment.value / 100) * 180 - 90; // -90 to 90 degrees

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-green-500/20 flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">FEAR & GREED INDEX</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Market Sentiment Indicator</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                    <span className="text-xs text-bullish font-mono">LIVE</span>
                </div>
            </div>

            {/* Gauge Display */}
            <div className="flex flex-col items-center py-6">
                <div className="relative w-48 h-24 overflow-hidden">
                    {/* Gauge background */}
                    <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />

                    {/* Gauge arc segments */}
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="25%" stopColor="#f97316" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="75%" stopColor="#84cc16" />
                                <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M 20 95 A 80 80 0 0 1 180 95"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Needle */}
                    <div
                        className={`absolute bottom-0 left-1/2 w-1 h-20 origin-bottom transition-transform duration-700 ease-out ${isAnimating ? 'scale-110' : ''}`}
                        style={{ transform: `translateX(-50%) rotate(${gaugeRotation}deg)` }}
                    >
                        <div className="w-full h-full bg-gradient-to-t from-white to-primary rounded-full shadow-lg" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
                    </div>
                </div>

                {/* Value Display */}
                <div className={`text-center mt-4 transition-all duration-300 ${isAnimating ? 'scale-105' : ''}`}>
                    <div className={`text-5xl font-bold ${sentiment.color} font-mono`}>
                        {sentiment.value}
                    </div>
                    <div className={`text-lg font-semibold ${sentiment.color} mt-1`}>
                        {sentiment.label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                        {sentiment.description}
                    </p>
                </div>
            </div>

            {/* Sentiment Scale */}
            <div className="grid grid-cols-5 gap-1 mt-4 text-center text-xs">
                <div className="p-2 rounded bg-red-500/10 text-red-400">
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                    <span>Extreme Fear</span>
                </div>
                <div className="p-2 rounded bg-orange-500/10 text-orange-400">
                    <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                    <span>Fear</span>
                </div>
                <div className="p-2 rounded bg-yellow-500/10 text-yellow-400">
                    <Minus className="w-4 h-4 mx-auto mb-1" />
                    <span>Neutral</span>
                </div>
                <div className="p-2 rounded bg-lime-500/10 text-lime-400">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                    <span>Greed</span>
                </div>
                <div className="p-2 rounded bg-green-500/10 text-green-400">
                    <Zap className="w-4 h-4 mx-auto mb-1" />
                    <span>Extreme Greed</span>
                </div>
            </div>

            {/* Contributing Factors */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Contributing Factors</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 text-primary" />
                        <span className="text-muted-foreground">Market Volatility</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-bullish" />
                        <span className="text-muted-foreground">Price Momentum</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="text-muted-foreground">Social Sentiment</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-yellow-400" />
                        <span className="text-muted-foreground">Market Dominance</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FearGreedIndex;
