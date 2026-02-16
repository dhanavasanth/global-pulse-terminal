/**
 * Ticker Search - Autocomplete search for stock symbols
 */
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Building2 } from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface SearchResult {
    symbol: string;
    name: string;
    currency: string;
    exchangeShortName: string;
    stockExchange: string;
}

export default function TickerSearch() {
    const { symbol, setSymbol, searchSymbols } = useStock();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            const data = await searchSymbols(query);
            setResults(data.slice(0, 8));
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchSymbols]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (result: SearchResult) => {
        setSymbol(result.symbol);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={`Search stocks... (Current: ${symbol})`}
                    className="w-full pl-10 pr-10 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (query || results.length > 0) && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto">
                            {results.map((result) => (
                                <button
                                    key={result.symbol}
                                    onClick={() => handleSelect(result)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-0"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">{result.symbol}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                                {result.exchangeShortName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{result.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length > 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">
                            No results found for "{query}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
