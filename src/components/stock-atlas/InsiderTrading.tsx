/**
 * Insider Trading - Recent insider transactions
 */
import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface InsiderTrade {
    symbol: string;
    transactionDate: string;
    reportingName: string;
    transactionType: string;
    securitiesOwned: number;
    securitiesTransacted: number;
    price: number;
    securityName: string;
    link: string;
}

function formatCurrency(num: number | null | undefined): string {
    if (num === undefined || num === null) return '-';
    const absNum = Math.abs(num);
    if (absNum >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
}

export default function InsiderTrading() {
    const { symbol } = useStock();
    const [trades, setTrades] = useState<InsiderTrade[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        setLoading(true);
        fetch(`http://localhost:8000/api/stock/insider-trading/${symbol}?limit=15`)
            .then(res => res.json())
            .then(data => setTrades(Array.isArray(data) ? data : []))
            .catch(() => setTrades([]))
            .finally(() => setLoading(false));
    }, [symbol]);

    if (loading) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Insider Trading
                </h3>
                <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-secondary/30 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (trades.length === 0) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Insider Trading
                </h3>
                <p className="text-center text-muted-foreground py-8">No insider trading data available</p>
            </div>
        );
    }

    // Calculate stats
    const buys = trades.filter(t => t.transactionType?.toLowerCase().includes('buy') || t.transactionType?.toLowerCase().includes('purchase'));
    const sells = trades.filter(t => t.transactionType?.toLowerCase().includes('sale') || t.transactionType?.toLowerCase().includes('sell'));
    const buyValue = buys.reduce((sum, t) => sum + (t.securitiesTransacted * t.price), 0);
    const sellValue = sells.reduce((sum, t) => sum + (t.securitiesTransacted * t.price), 0);

    return (
        <div className="glass-card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Insider Trading
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bullish/10 border border-bullish/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-bullish text-xs mb-1">
                        <TrendingUp className="w-4 h-4" />
                        Insider Buys
                    </div>
                    <div className="text-lg font-bold text-bullish">{formatCurrency(buyValue)}</div>
                    <div className="text-xs text-muted-foreground">{buys.length} transactions</div>
                </div>
                <div className="bg-bearish/10 border border-bearish/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-bearish text-xs mb-1">
                        <TrendingDown className="w-4 h-4" />
                        Insider Sells
                    </div>
                    <div className="text-lg font-bold text-bearish">{formatCurrency(sellValue)}</div>
                    <div className="text-xs text-muted-foreground">{sells.length} transactions</div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {trades.slice(0, 10).map((trade, index) => {
                    const isBuy = trade.transactionType?.toLowerCase().includes('buy') ||
                        trade.transactionType?.toLowerCase().includes('purchase') ||
                        trade.transactionType?.toLowerCase().includes('acquisition');
                    const value = trade.securitiesTransacted * trade.price;

                    return (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all hover:border-primary/30 ${isBuy ? 'bg-bullish/5 border-bullish/20' : 'bg-bearish/5 border-bearish/20'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-foreground truncate">
                                            {trade.reportingName}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${isBuy
                                                ? 'bg-bullish/20 text-bullish'
                                                : 'bg-bearish/20 text-bearish'
                                            }`}>
                                            {isBuy ? 'BUY' : 'SELL'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(trade.transactionDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                        {' • '}
                                        {trade.securitiesTransacted?.toLocaleString()} shares @ ${trade.price?.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${isBuy ? 'text-bullish' : 'text-bearish'}`}>
                                        {formatCurrency(value)}
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
