/**
 * Key Metrics - Display important stock metrics
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

function formatNumber(num: number | null | undefined, decimals: number = 2): string {
    if (num === undefined || num === null || isNaN(num)) return '-';
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatPercent(num: number | null | undefined): string {
    if (num === undefined || num === null || isNaN(num)) return '-';
    return `${(num * 100).toFixed(2)}%`;
}

interface MetricCardProps {
    label: string;
    value: string;
    sublabel?: string;
    tooltip?: string;
    positive?: boolean | null;
}

function MetricCard({ label, value, sublabel, tooltip, positive }: MetricCardProps) {
    return (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                {tooltip && (
                    <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-lg w-48 z-10">
                            {tooltip}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${positive === true ? 'text-bullish' : positive === false ? 'text-bearish' : 'text-foreground'}`}>
                    {value}
                </span>
                {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
            </div>
        </div>
    );
}

export default function KeyMetricsGrid() {
    const { symbol, keyMetrics, quote, profile, fetchData, isLoading } = useStock();
    const [priceChange, setPriceChange] = useState<any>(null);

    // Fetch price change data
    useEffect(() => {
        if (symbol) {
            fetchData('price-change', symbol)
                .then(setPriceChange)
                .catch(() => setPriceChange(null));
        }
    }, [symbol, fetchData]);

    if (isLoading && !keyMetrics) {
        return (
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-secondary/30 rounded-xl p-4 h-20" />
                    ))}
                </div>
            </div>
        );
    }

    const metrics = keyMetrics || {};

    return (
        <div className="glass-card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Key Metrics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Valuation */}
                <MetricCard
                    label="P/E Ratio (TTM)"
                    value={formatNumber(metrics.peRatioTTM || quote?.pe)}
                    tooltip="Price to Earnings ratio - lower may indicate undervaluation"
                />
                <MetricCard
                    label="PEG Ratio"
                    value={formatNumber(metrics.pegRatioTTM)}
                    tooltip="P/E to Growth - below 1 may indicate undervaluation"
                    positive={metrics.pegRatioTTM ? metrics.pegRatioTTM < 1 : null}
                />
                <MetricCard
                    label="P/B Ratio"
                    value={formatNumber(metrics.priceToBookRatioTTM)}
                    tooltip="Price to Book value"
                />
                <MetricCard
                    label="P/S Ratio"
                    value={formatNumber(metrics.priceToSalesRatioTTM)}
                    tooltip="Price to Sales"
                />

                {/* Profitability */}
                <MetricCard
                    label="Gross Margin"
                    value={formatPercent(metrics.grossProfitMarginTTM)}
                    tooltip="Revenue minus cost of goods sold"
                    positive={metrics.grossProfitMarginTTM ? metrics.grossProfitMarginTTM > 0.3 : null}
                />
                <MetricCard
                    label="Net Margin"
                    value={formatPercent(metrics.netProfitMarginTTM)}
                    tooltip="Net income as percentage of revenue"
                    positive={metrics.netProfitMarginTTM ? metrics.netProfitMarginTTM > 0.1 : null}
                />
                <MetricCard
                    label="ROE"
                    value={formatPercent(metrics.returnOnEquityTTM)}
                    tooltip="Return on Equity - measures profitability"
                    positive={metrics.returnOnEquityTTM ? metrics.returnOnEquityTTM > 0.15 : null}
                />
                <MetricCard
                    label="ROA"
                    value={formatPercent(metrics.returnOnAssetsTTM)}
                    tooltip="Return on Assets"
                    positive={metrics.returnOnAssetsTTM ? metrics.returnOnAssetsTTM > 0.05 : null}
                />

                {/* Liquidity */}
                <MetricCard
                    label="Current Ratio"
                    value={formatNumber(metrics.currentRatioTTM)}
                    tooltip="Current assets / current liabilities - above 1 is healthy"
                    positive={metrics.currentRatioTTM ? metrics.currentRatioTTM > 1 : null}
                />
                <MetricCard
                    label="Quick Ratio"
                    value={formatNumber(metrics.quickRatioTTM)}
                    tooltip="Liquid assets / current liabilities"
                    positive={metrics.quickRatioTTM ? metrics.quickRatioTTM > 1 : null}
                />
                <MetricCard
                    label="Debt/Equity"
                    value={formatNumber(metrics.debtEquityRatioTTM)}
                    tooltip="Total debt / shareholder equity - lower is better"
                    positive={metrics.debtEquityRatioTTM ? metrics.debtEquityRatioTTM < 1 : null}
                />
                <MetricCard
                    label="Dividend Yield"
                    value={formatPercent(metrics.dividendYieldTTM)}
                    tooltip="Annual dividend / share price"
                />

                {/* Performance */}
                {priceChange && (
                    <>
                        <MetricCard
                            label="1 Week Change"
                            value={`${priceChange['1W'] >= 0 ? '+' : ''}${formatNumber(priceChange['1W'])}%`}
                            positive={priceChange['1W'] >= 0}
                        />
                        <MetricCard
                            label="1 Month Change"
                            value={`${priceChange['1M'] >= 0 ? '+' : ''}${formatNumber(priceChange['1M'])}%`}
                            positive={priceChange['1M'] >= 0}
                        />
                        <MetricCard
                            label="YTD Change"
                            value={`${priceChange.ytd >= 0 ? '+' : ''}${formatNumber(priceChange.ytd)}%`}
                            positive={priceChange.ytd >= 0}
                        />
                        <MetricCard
                            label="1 Year Change"
                            value={`${priceChange['1Y'] >= 0 ? '+' : ''}${formatNumber(priceChange['1Y'])}%`}
                            positive={priceChange['1Y'] >= 0}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
