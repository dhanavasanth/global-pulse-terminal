/**
 * Financial Statements - Income, Balance Sheet, Cash Flow
 */
import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

function formatCurrency(num: number | null | undefined): string {
    if (num === undefined || num === null) return '-';
    const absNum = Math.abs(num);
    if (absNum >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (absNum >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
}

type StatementType = 'income' | 'balance' | 'cashflow';

interface FinancialStatementsProps {
    defaultType?: StatementType;
}

export default function FinancialStatements({ defaultType = 'income' }: FinancialStatementsProps) {
    const { symbol, fetchData, isLoading } = useStock();
    const [type, setType] = useState<StatementType>(defaultType);
    const [period, setPeriod] = useState<'annual' | 'quarter'>('annual');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);

    // Fetch data based on type
    useEffect(() => {
        if (!symbol) return;

        const endpoints: Record<StatementType, string> = {
            income: 'income-statement',
            balance: 'balance-sheet',
            cashflow: 'cash-flow'
        };

        setLoading(true);
        fetch(`http://localhost:8000/api/stock/${endpoints[type]}/${symbol}?period=${period}&limit=5`)
            .then(res => res.json())
            .then(setData)
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [symbol, type, period]);

    const titles: Record<StatementType, string> = {
        income: 'Income Statement',
        balance: 'Balance Sheet',
        cashflow: 'Cash Flow Statement'
    };

    // Define rows for each statement type
    const incomeRows = [
        { key: 'revenue', label: 'Revenue' },
        { key: 'costOfRevenue', label: 'Cost of Revenue' },
        { key: 'grossProfit', label: 'Gross Profit' },
        { key: 'operatingExpenses', label: 'Operating Expenses' },
        { key: 'operatingIncome', label: 'Operating Income' },
        { key: 'interestExpense', label: 'Interest Expense' },
        { key: 'incomeBeforeTax', label: 'Income Before Tax' },
        { key: 'incomeTaxExpense', label: 'Income Tax' },
        { key: 'netIncome', label: 'Net Income', highlight: true },
        { key: 'eps', label: 'EPS' },
        { key: 'epsdiluted', label: 'EPS Diluted' },
    ];

    const balanceRows = [
        { key: 'totalAssets', label: 'Total Assets', highlight: true },
        { key: 'cashAndCashEquivalents', label: 'Cash & Equivalents' },
        { key: 'shortTermInvestments', label: 'Short-term Investments' },
        { key: 'netReceivables', label: 'Net Receivables' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'propertyPlantEquipmentNet', label: 'PP&E' },
        { key: 'totalLiabilities', label: 'Total Liabilities', highlight: true },
        { key: 'totalCurrentLiabilities', label: 'Current Liabilities' },
        { key: 'longTermDebt', label: 'Long-term Debt' },
        { key: 'totalStockholdersEquity', label: 'Stockholders Equity', highlight: true },
    ];

    const cashflowRows = [
        { key: 'operatingCashFlow', label: 'Operating Cash Flow', highlight: true },
        { key: 'netIncome', label: 'Net Income' },
        { key: 'depreciationAndAmortization', label: 'Depreciation & Amortization' },
        { key: 'changeInWorkingCapital', label: 'Change in Working Capital' },
        { key: 'capitalExpenditure', label: 'Capital Expenditure' },
        { key: 'investmentsInPropertyPlantAndEquipment', label: 'Investments in PP&E' },
        { key: 'freeCashFlow', label: 'Free Cash Flow', highlight: true },
        { key: 'dividendsPaid', label: 'Dividends Paid' },
        { key: 'commonStockRepurchased', label: 'Stock Buybacks' },
    ];

    const rows = type === 'income' ? incomeRows : type === 'balance' ? balanceRows : cashflowRows;

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div
                className="p-4 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/20"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{titles[type]}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Statement Type Selector */}
                    <div className="flex gap-1 bg-secondary/40 rounded-lg p-1" onClick={e => e.stopPropagation()}>
                        {(['income', 'balance', 'cashflow'] as StatementType[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-2.5 py-1 text-xs rounded-md transition-all ${type === t
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {t === 'income' ? 'Income' : t === 'balance' ? 'Balance' : 'Cash Flow'}
                            </button>
                        ))}
                    </div>
                    {/* Period Selector */}
                    <div className="flex gap-1 bg-secondary/40 rounded-lg p-1" onClick={e => e.stopPropagation()}>
                        {(['annual', 'quarter'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-2.5 py-1 text-xs rounded-md transition-all ${period === p
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {p === 'annual' ? 'Annual' : 'Quarterly'}
                            </button>
                        ))}
                    </div>
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {/* Table */}
            {expanded && (
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No data available</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left p-3 text-muted-foreground font-medium sticky left-0 bg-card">Metric</th>
                                    {data.map((item, i) => (
                                        <th key={i} className="text-right p-3 text-muted-foreground font-medium min-w-[100px]">
                                            {period === 'annual'
                                                ? new Date(item.date).getFullYear()
                                                : `Q${Math.ceil((new Date(item.date).getMonth() + 1) / 3)} ${new Date(item.date).getFullYear()}`
                                            }
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.key} className={`border-b border-border/30 hover:bg-secondary/20 ${row.highlight ? 'bg-primary/5' : ''}`}>
                                        <td className={`p-3 sticky left-0 bg-card ${row.highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                            {row.label}
                                        </td>
                                        {data.map((item, i) => {
                                            const value = item[row.key];
                                            const prevValue = data[i + 1]?.[row.key];
                                            const growth = prevValue && value ? ((value - prevValue) / Math.abs(prevValue)) * 100 : null;

                                            return (
                                                <td key={i} className={`p-3 text-right ${row.highlight ? 'font-semibold' : ''}`}>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{formatCurrency(value)}</span>
                                                        {growth !== null && Math.abs(growth) < 1000 && (
                                                            <span className={`text-xs ${growth >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                                                                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
