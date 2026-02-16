
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSentimentData, getMarketContext } from '@/lib/screener-api';
import { TrendingUp, Globe, Newspaper } from "lucide-react";

const MarketIntelligence: React.FC = () => {
    const sentiment = getSentimentData("TCS");
    const market = getMarketContext();

    return (
        <div className="space-y-6">
            <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                        <Globe className="w-5 h-5" /> Macro & Market Layer
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-secondary/40 p-3 rounded-md text-center border border-border">
                            <span className="block text-xs text-muted-foreground uppercase tracking-widest">Index Bias</span>
                            <span className={`text-lg font-bold ${market.index_bias === 'bullish' ? 'text-bullish' : 'text-bearish'}`}>
                                {market.index_bias.toUpperCase()}
                            </span>
                        </div>
                        <div className="bg-secondary/40 p-3 rounded-md text-center border border-border">
                            <span className="block text-xs text-muted-foreground uppercase tracking-widest">Sector Strength</span>
                            <span className="text-lg font-bold text-blue-500">{market.sector_strength}/100</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
                        <Newspaper className="w-5 h-5" /> Sentiment Engine
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-3xl font-bold text-foreground">{sentiment.sentiment}</span>
                            <span className="text-xs text-muted-foreground ml-2">/ 1.0</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs text-muted-foreground">Confidence</span>
                            <span className="font-mono text-bullish">{(sentiment.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Source Mix</p>
                        <div className="flex h-2 w-full rounded-full overflow-hidden">
                            <div style={{ width: `${sentiment.source_mix.news}%` }} className="bg-blue-500" title="News" />
                            <div style={{ width: `${sentiment.source_mix.filings}%` }} className="bg-purple-500" title="Filings" />
                            <div style={{ width: `${sentiment.source_mix.macro}%` }} className="bg-orange-500" title="Macro" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> News {sentiment.source_mix.news}%</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Filings {sentiment.source_mix.filings}%</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Macro {sentiment.source_mix.macro}%</div>
                        </div>
                    </div>

                    {/* Progress Bar Representation (New) */}
                    <div className="space-y-3 pt-2 border-t border-border/50">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span>Sentiment Score</span>
                                <span className={sentiment.sentiment >= 0.5 ? 'text-bullish' : 'text-bearish'}>{(sentiment.sentiment * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${sentiment.sentiment >= 0.5 ? 'bg-bullish' : 'bg-bearish'}`}
                                    style={{ width: `${sentiment.sentiment * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MarketIntelligence;
