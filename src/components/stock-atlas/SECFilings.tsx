/**
 * SEC Filings - Company SEC filings with links
 */
import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface Filing {
    symbol: string;
    cik: string;
    type: string;
    link: string;
    finalLink: string;
    acceptedDate: string;
    fillingDate: string;
}

const FILING_COLORS: Record<string, string> = {
    '10-K': 'bg-blue-500/20 text-blue-400',
    '10-Q': 'bg-purple-500/20 text-purple-400',
    '8-K': 'bg-orange-500/20 text-orange-400',
    '4': 'bg-green-500/20 text-green-400',
    'DEF 14A': 'bg-pink-500/20 text-pink-400',
    '13F-HR': 'bg-cyan-500/20 text-cyan-400',
};

const FILING_DESCRIPTIONS: Record<string, string> = {
    '10-K': 'Annual Report',
    '10-Q': 'Quarterly Report',
    '8-K': 'Current Report',
    '4': 'Insider Transaction',
    'DEF 14A': 'Proxy Statement',
    '13F-HR': 'Institutional Holdings',
    'S-1': 'IPO Registration',
    'S-3': 'Shelf Registration',
    '424B2': 'Prospectus',
};

export default function SECFilings() {
    const { symbol } = useStock();
    const [filings, setFilings] = useState<Filing[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!symbol) return;

        setLoading(true);
        fetch(`http://localhost:8000/api/stock/sec-filings/${symbol}?limit=30`)
            .then(res => res.json())
            .then(data => setFilings(Array.isArray(data) ? data : []))
            .catch(() => setFilings([]))
            .finally(() => setLoading(false));
    }, [symbol]);

    const filingTypes = ['all', ...new Set(filings.map(f => f.type).filter(Boolean))];
    const filteredFilings = filter === 'all'
        ? filings
        : filings.filter(f => f.type === filter);

    return (
        <div className="glass-card overflow-hidden">
            <div
                className="p-4 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/20"
                onClick={() => setExpanded(!expanded)}
            >
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    SEC Filings
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {filings.length} filings
                    </span>
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {expanded && (
                <div className="p-4">
                    {/* Filter */}
                    <div className="flex flex-wrap gap-2 mb-4" onClick={e => e.stopPropagation()}>
                        {filingTypes.slice(0, 7).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${filter === type
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-secondary/30 rounded-lg" />
                            ))}
                        </div>
                    ) : filteredFilings.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No filings available</p>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filteredFilings.slice(0, 15).map((filing, index) => (
                                <a
                                    key={index}
                                    href={filing.finalLink || filing.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${FILING_COLORS[filing.type] || 'bg-secondary text-muted-foreground'}`}>
                                            {filing.type}
                                        </span>
                                        <div>
                                            <div className="font-medium text-foreground text-sm">
                                                {FILING_DESCRIPTIONS[filing.type] || filing.type}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(filing.fillingDate || filing.acceptedDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
