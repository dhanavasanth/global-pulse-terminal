/**
 * Institutional Ownership - Top institutional holders
 */
import React, { useEffect, useState } from 'react';
import { Building2, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface Institution {
    holder: string;
    shares: number;
    dateReported: string;
    change: number;
    changePercentage: number;
    percentage: number;
}

function formatNumber(num: number | null | undefined): string {
    if (num === undefined || num === null) return '-';
    if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
}

export default function InstitutionalOwnership() {
    const { symbol } = useStock();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;

        setLoading(true);
        fetch(`http://localhost:8000/api/stock/institutional/${symbol}`)
            .then(res => res.json())
            .then(data => setInstitutions(Array.isArray(data) ? data.slice(0, 15) : []))
            .catch(() => setInstitutions([]))
            .finally(() => setLoading(false));
    }, [symbol]);

    if (loading) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Institutional Ownership
                </h3>
                <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-secondary/30 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (institutions.length === 0) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Institutional Ownership
                </h3>
                <p className="text-center text-muted-foreground py-8">No institutional data available</p>
            </div>
        );
    }

    // Calculate totals
    const totalShares = institutions.reduce((sum, i) => sum + (i.shares || 0), 0);
    const totalChange = institutions.reduce((sum, i) => sum + (i.change || 0), 0);

    return (
        <div className="glass-card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Institutional Ownership
            </h3>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/30 rounded-xl p-3 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Users className="w-4 h-4" />
                        Total Institutional
                    </div>
                    <div className="text-lg font-bold">{formatNumber(totalShares)} shares</div>
                </div>
                <div className={`rounded-xl p-3 border ${totalChange >= 0 ? 'bg-bullish/10 border-bullish/30' : 'bg-bearish/10 border-bearish/30'}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {totalChange >= 0 ? <TrendingUp className="w-4 h-4 text-bullish" /> : <TrendingDown className="w-4 h-4 text-bearish" />}
                        Net Change
                    </div>
                    <div className={`text-lg font-bold ${totalChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {totalChange >= 0 ? '+' : ''}{formatNumber(totalChange)}
                    </div>
                </div>
            </div>

            {/* Holdings List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {institutions.map((inst, index) => {
                    const isPositiveChange = (inst.change || 0) >= 0;

                    return (
                        <div
                            key={index}
                            className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground text-sm truncate">
                                        {inst.holder}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatNumber(inst.shares)} shares
                                        {inst.percentage ? ` (${inst.percentage.toFixed(2)}%)` : ''}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-medium ${isPositiveChange ? 'text-bullish' : 'text-bearish'}`}>
                                        {isPositiveChange ? '+' : ''}{formatNumber(inst.change)}
                                    </div>
                                    {inst.changePercentage && (
                                        <div className={`text-xs ${isPositiveChange ? 'text-bullish' : 'text-bearish'}`}>
                                            {isPositiveChange ? '+' : ''}{inst.changePercentage.toFixed(2)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
