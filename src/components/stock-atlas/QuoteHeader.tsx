/**
 * Quote Header - Live stock price and key stats
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Building2, Globe, RefreshCw } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

function formatNumber(num: number | undefined, decimals: number = 2): string {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatMarketCap(num: number | undefined): string {
    if (!num) return '-';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

function formatVolume(num: number | undefined): string {
    if (!num) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
}

export default function QuoteHeader() {
    const { symbol, profile, quote, isLoading, fetchQuote } = useStock();
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Auto-refresh quote every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (symbol) {
                fetchQuote(symbol);
                setLastUpdate(new Date());
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [symbol, fetchQuote]);

    const isPositive = (quote?.changesPercentage ?? 0) >= 0;

    if (isLoading && !profile) {
        return (
            <div className="glass-card p-6 animate-pulse">
                <div className="h-8 bg-secondary/50 rounded w-1/3 mb-3" />
                <div className="h-12 bg-secondary/50 rounded w-1/4 mb-4" />
                <div className="flex gap-8">
                    <div className="h-6 bg-secondary/50 rounded w-24" />
                    <div className="h-6 bg-secondary/50 rounded w-24" />
                    <div className="h-6 bg-secondary/50 rounded w-24" />
                </div>
            </div>
        );
    }

    if (!profile && !quote) {
        return (
            <div className="glass-card p-6 text-center text-muted-foreground">
                Search for a stock to view data
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            {/* Company Info Row */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {profile?.image && (
                        <img
                            src={profile.image}
                            alt={profile.companyName}
                            className="w-14 h-14 rounded-xl object-contain bg-white p-1"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            {profile?.companyName || quote?.name || symbol}
                            <span className="text-lg font-mono text-muted-foreground">
                                ({symbol})
                            </span>
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {profile?.exchange || 'N/A'}
                            </span>
                            <span>•</span>
                            <span>{profile?.sector || 'N/A'}</span>
                            <span>•</span>
                            <span>{profile?.industry || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-bullish/10 text-bullish">
                        <div className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
                        LIVE
                    </div>
                    <button
                        onClick={() => {
                            fetchQuote(symbol);
                            setLastUpdate(new Date());
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-bold text-foreground">
                    ${formatNumber(quote?.price || profile?.price)}
                </span>
                <div className={`flex items-center gap-1.5 text-lg font-medium ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span>{isPositive ? '+' : ''}{formatNumber(quote?.change)}</span>
                    <span className="text-sm">
                        ({isPositive ? '+' : ''}{formatNumber(quote?.changesPercentage)}%)
                    </span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatItem label="Market Cap" value={formatMarketCap(quote?.marketCap || profile?.mktCap)} />
                <StatItem label="Volume" value={formatVolume(quote?.volume)} />
                <StatItem label="Avg Volume" value={formatVolume(quote?.avgVolume || profile?.volAvg)} />
                <StatItem label="P/E Ratio" value={formatNumber(quote?.pe)} />
                <StatItem label="EPS" value={`$${formatNumber(quote?.eps)}`} />
                <StatItem label="52W Range" value={`$${formatNumber(quote?.yearLow)} - $${formatNumber(quote?.yearHigh)}`} />
            </div>

            {/* Day Range */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Day Range</span>
                    <span>${formatNumber(quote?.dayLow)} - ${formatNumber(quote?.dayHigh)}</span>
                </div>
                <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    {quote?.dayLow && quote?.dayHigh && quote?.price && (
                        <div
                            className="absolute top-0 bottom-0 w-2 bg-primary rounded-full"
                            style={{
                                left: `${((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100}%`,
                                transform: 'translateX(-50%)'
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium text-foreground">{value}</p>
        </div>
    );
}
