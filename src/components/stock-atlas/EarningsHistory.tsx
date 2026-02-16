/**
 * Earnings History - Historical earnings with beat/miss analysis
 */
import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface EarningsData {
    date: string;
    symbol: string;
    eps: number;
    epsEstimated: number;
    revenue: number;
    revenueEstimated: number;
}

function formatNumber(num: number | null | undefined, decimals: number = 2): string {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatCurrency(num: number | null | undefined): string {
    if (num === undefined || num === null) return '-';
    const absNum = Math.abs(num);
    if (absNum >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
}

export default function EarningsHistory() {
    const { symbol, fetchData } = useStock();
    const [earnings, setEarnings] = useState<EarningsData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        setLoading(true);
        fetch(`http://localhost:8000/api/stock/earnings/${symbol}?limit=8`)
            .then(res => res.json())
            .then(data => setEarnings(Array.isArray(data) ? data : []))
            .catch(() => setEarnings([]))
            .finally(() => setLoading(false));
    }, [symbol]);

    if (loading) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Earnings History
                </h3>
                <div className="animate-pulse space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-secondary/30 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (earnings.length === 0) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Earnings History
                </h3>
                <p className="text-center text-muted-foreground py-8">No earnings data available</p>
            </div>
        );
    }

    // Calculate stats
    const totalBeats = earnings.filter(e => e.eps > e.epsEstimated).length;
    const beatRate = (totalBeats / earnings.length) * 100;

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Earnings History
                </h3>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Beat Rate:</span>
                    <span className={`font-bold ${beatRate >= 50 ? 'text-bullish' : 'text-bearish'}`}>
                        {beatRate.toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground">({totalBeats}/{earnings.length})</span>
                </div>
            </div>

            <div className="space-y-3">
                {earnings.map((earning, index) => {
                    const epsBeat = earning.eps > earning.epsEstimated;
                    const epsSurprise = earning.epsEstimated
                        ? ((earning.eps - earning.epsEstimated) / Math.abs(earning.epsEstimated)) * 100
                        : 0;
                    const revenueBeat = earning.revenue > earning.revenueEstimated;
                    const revenueSurprise = earning.revenueEstimated
                        ? ((earning.revenue - earning.revenueEstimated) / Math.abs(earning.revenueEstimated)) * 100
                        : 0;

                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-xl border transition-all hover:border-primary/30 ${epsBeat ? 'bg-bullish/5 border-bullish/30' : 'bg-bearish/5 border-bearish/30'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {epsBeat ? (
                                        <CheckCircle className="w-5 h-5 text-bullish" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-bearish" />
                                    )}
                                    <span className="font-medium">
                                        {new Date(earning.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${epsBeat
                                            ? 'bg-bullish/20 text-bullish'
                                            : 'bg-bearish/20 text-bearish'
                                        }`}>
                                        {epsBeat ? 'BEAT' : 'MISS'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* EPS */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">EPS</span>
                                        <span className={`text-xs font-medium ${epsBeat ? 'text-bullish' : 'text-bearish'}`}>
                                            {epsSurprise >= 0 ? '+' : ''}{epsSurprise.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold">${formatNumber(earning.eps)}</span>
                                        <span className="text-sm text-muted-foreground">
                                            vs ${formatNumber(earning.epsEstimated)} est
                                        </span>
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">Revenue</span>
                                        <span className={`text-xs font-medium ${revenueBeat ? 'text-bullish' : 'text-bearish'}`}>
                                            {revenueSurprise >= 0 ? '+' : ''}{revenueSurprise.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold">{formatCurrency(earning.revenue)}</span>
                                        <span className="text-sm text-muted-foreground">
                                            vs {formatCurrency(earning.revenueEstimated)} est
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
