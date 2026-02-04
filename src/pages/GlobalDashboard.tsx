import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Globe, TrendingUp, Newspaper, ArrowLeft, Sparkles } from "lucide-react";

// Components
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { BiasGauge } from "@/components/dashboard/BiasGauge";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { SentimentTrendChart } from "@/components/dashboard/SentimentTrendChart";
import { MarketSentimentCounts } from "@/components/dashboard/MarketSentimentCounts";

const GlobalDashboard = () => {
    // State for data
    const [biasScore, setBiasScore] = useState<number | null>(null);
    const [biasLabel, setBiasLabel] = useState<string>("Loading...");

    // Effect to fetch initial data
    useEffect(() => {
        const fetchBias = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/bias');
                const data = await response.json();
                setBiasScore(data.score);
                setBiasLabel(data.bias.replace('_', ' '));
            } catch (err) {
                console.error("Failed to fetch bias:", err);
                setBiasScore(0);
                setBiasLabel("OFFLINE");
            }
        };

        fetchBias();
        const interval = setInterval(fetchBias, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
            {/* Header / Navigation Bar */}
            <header className="glass-card border-b border-border px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">Back</span>
                        </Link>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-foreground shadow-sm">
                                Market & Sentiment Dashboard
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <Activity className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
                        <Globe className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                </div>
            </header>

            {/* Market Ticker */}
            <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm z-40">
                <MarketTicker />
            </div>

            <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN: Gauge (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col h-full min-h-[400px]">
                        <div className="glass-card p-1 flex-1 relative overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950/50 border-border/50 shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50" />
                            <div className="p-6 h-full flex flex-col">
                                <h2 className="text-lg font-bold tracking-tight mb-4 text-center text-slate-100">NIFTY Intraday Bias</h2>
                                <div className="flex-1">
                                    <BiasGauge score={biasScore} label={biasLabel} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Overview + News/Sentiment (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Top: Global Market Overview */}
                        <div className="glass-card p-6 bg-slate-900/30 border-border/50">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Global Market Overview
                            </h3>
                            <div className="h-[140px]">
                                <MarketOverview />
                            </div>
                        </div>

                        {/* Middle: News & Sentiment Counts split */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[320px]">
                            {/* News Feed (2 cols) */}
                            <div className="md:col-span-2 glass-card p-0 flex flex-col bg-slate-900/30 border-border/50 overflow-hidden">
                                <div className="p-4 border-b border-border/40 bg-secondary/10 flex justify-between items-center">
                                    <h3 className="font-semibold text-sm">Latest News</h3>
                                    <span className="text-[10px] text-muted-foreground">Real-time Feed</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <NewsFeed />
                                </div>
                            </div>

                            {/* Sentiment Counts (1 col) */}
                            <div className="md:col-span-1 h-full">
                                {/* Use the new component we created */}
                                <MarketSentimentCounts positive={12} neutral={7} negative={6} />
                            </div>
                        </div>

                    </div>

                    {/* BOTTOM ROW: Trend Chart (Full Width) */}
                    <div className="col-span-1 lg:col-span-12 h-[350px]">
                        <SentimentTrendChart />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default GlobalDashboard;
