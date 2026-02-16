import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";

// TradingView Widgets
import TradingViewTickerTape from "@/components/TradingViewTickerTape";
import TradingViewMarketOverview from "@/components/TradingViewMarketOverview";
import TradingViewEconomicCalendar from "@/components/TradingViewEconomicCalendar";
import TradingViewTopMovers from "@/components/TradingViewTopMovers";
import TradingViewHeatmap from "@/components/TradingViewHeatmap";
import TradingViewScreener from "@/components/TradingViewScreener";
import TradingViewForexCrossRates from "@/components/TradingViewForexCrossRates";

// Custom Components
import { BiasGauge } from "@/components/dashboard/BiasGauge";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
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
                setBiasScore(50);
                setBiasLabel("NEUTRAL");
            }
        };

        fetchBias();
        const interval = setInterval(fetchBias, 30000);
        return () => clearInterval(interval);
    }, []);

    const customHeader = (
        <header className="glass-card border-b border-border px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold tracking-tight text-foreground">
                    Global Market Dashboard
                </h1>
            </div>
        </header>
    );

    return (
        <MainLayout header={customHeader}>
            {/* Ticker Tape - Scrolling Market Data */}
            <div className="border-b border-border/40 bg-card/30 backdrop-blur-sm z-40 mb-4">
                <TradingViewTickerTape />
            </div>

            <div className="max-w-[1800px] mx-auto space-y-6 pb-8">

                {/* Row 1: Bias Gauge + Global Markets */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Bias Gauge */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-1 relative overflow-hidden bg-card border-border/50 shadow-2xl h-full">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50" />
                            <div className="p-6 h-full flex flex-col min-h-[350px]">
                                <h2 className="text-lg font-bold tracking-tight mb-4 text-center text-foreground">NIFTY Intraday Bias</h2>
                                <div className="flex-1">
                                    <BiasGauge score={biasScore} label={biasLabel} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Global Market Overview - TradingView */}
                    <div className="lg:col-span-9">
                        <TradingViewMarketOverview height={350} />
                    </div>
                </div>

                {/* Row 2: Top Movers + Economic Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewTopMovers height={400} />
                    <TradingViewEconomicCalendar height={400} />
                </div>

                {/* Row 3: Heatmap */}
                <TradingViewHeatmap />

                {/* Row 4: Screener */}
                <TradingViewScreener />

                {/* Row 5: Forex Cross Rates + Sentiment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TradingViewForexCrossRates height={350} />

                    {/* News & Sentiment */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
                        {/* News Feed */}
                        <div className="md:col-span-2 glass-card p-0 flex flex-col bg-card/50 border-border/50 overflow-hidden">
                            <div className="p-4 border-b border-border/40 bg-secondary/10 flex justify-between items-center">
                                <h3 className="font-semibold text-sm">Latest News</h3>
                                <span className="text-[10px] text-muted-foreground">Real-time Feed</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <NewsFeed />
                            </div>
                        </div>

                        {/* Sentiment Counts */}
                        <div className="md:col-span-1 h-full">
                            <MarketSentimentCounts positive={12} neutral={7} negative={6} />
                        </div>
                    </div>
                </div>

                {/* Row 6: Sentiment Trend Chart */}
                <div className="h-[350px]">
                    <SentimentTrendChart />
                </div>

            </div>
        </MainLayout>
    );
};

export default GlobalDashboard;
