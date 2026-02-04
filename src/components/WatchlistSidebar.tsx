/**
 * WatchlistSidebar Component
 * 
 * A TradingView-style collapsible sidebar showing categorized market tickers.
 * Indian markets use Angel One API, others use simulated data.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Globe,
    TrendingUp,
    Bitcoin,
    Gem,
    DollarSign,
    Star,
    Plus,
    RefreshCw,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useChart } from '@/contexts/ChartContext';
import { useAngelOneAuth } from '@/contexts/AngelOneAuthContext';
import { getLTP, hasCredentials } from '@/lib/angelone';
import { COMMON_TOKENS } from '@/lib/angelone/types';
import type { LTPData } from '@/lib/angelone';
import AngelOneLoginModal from './AngelOneLoginModal';

interface TickerItem {
    symbol: string;
    tradingViewSymbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    angelToken?: string; // Angel One token for Indian stocks
    isLive?: boolean;
}

interface WatchlistCategory {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    tickers: TickerItem[];
    useAngelOne?: boolean;
}

// Token mapping is now imported from COMMON_TOKENS in types.ts

// Initial watchlist data
const createInitialWatchlistData = (): WatchlistCategory[] => [
    {
        id: 'global',
        name: 'Global Markets',
        icon: <Globe className="w-4 h-4" />,
        color: 'text-blue-400',
        useAngelOne: false,
        tickers: [
            { symbol: 'SPX', tradingViewSymbol: 'SP:SPX', name: 'S&P 500', price: 6039.03, change: -28.28, changePercent: -0.48 },
            { symbol: 'NQ', tradingViewSymbol: 'NASDAQ:NDX', name: 'NASDAQ 100', price: 21567.45, change: 156.23, changePercent: 0.73 },
            { symbol: 'DJI', tradingViewSymbol: 'DJ:DJI', name: 'Dow Jones', price: 44722.34, change: -189.45, changePercent: -0.42 },
            { symbol: 'DAX', tradingViewSymbol: 'XETR:DAX', name: 'DAX 40', price: 21567.89, change: 234.56, changePercent: 1.10 },
            { symbol: 'FTSE', tradingViewSymbol: 'FTSE:UKX', name: 'FTSE 100', price: 8567.23, change: -45.67, changePercent: -0.53 },
        ]
    },
    {
        id: 'indian',
        name: 'Indian Markets',
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-orange-400',
        useAngelOne: true,
        tickers: Object.entries(COMMON_TOKENS).map(([symbol, data]) => ({
            symbol,
            tradingViewSymbol: `NSE:${symbol}`,
            name: data.tradingsymbol, // Use tradingsymbol from types
            price: 0,
            change: 0,
            changePercent: 0,
            angelToken: data.symboltoken, // Use symboltoken from types
            isLive: false,
        })),
    },
    {
        id: 'crypto',
        name: 'Crypto',
        icon: <Bitcoin className="w-4 h-4" />,
        color: 'text-yellow-400',
        useAngelOne: false,
        tickers: [
            { symbol: 'BTCUSD', tradingViewSymbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', price: 102345.67, change: 2345.89, changePercent: 2.34 },
            { symbol: 'ETHUSD', tradingViewSymbol: 'BINANCE:ETHUSDT', name: 'Ethereum', price: 3234.56, change: -45.67, changePercent: -1.39 },
            { symbol: 'SOLUSD', tradingViewSymbol: 'BINANCE:SOLUSDT', name: 'Solana', price: 234.56, change: 12.34, changePercent: 5.55 },
            { symbol: 'XRPUSD', tradingViewSymbol: 'BINANCE:XRPUSDT', name: 'XRP', price: 2.34, change: 0.12, changePercent: 5.40 },
            { symbol: 'BNBUSD', tradingViewSymbol: 'BINANCE:BNBUSDT', name: 'BNB', price: 678.90, change: -12.34, changePercent: -1.79 },
        ]
    },
    {
        id: 'commodities',
        name: 'Commodities',
        icon: <Gem className="w-4 h-4" />,
        color: 'text-amber-400',
        useAngelOne: false,
        tickers: [
            { symbol: 'GOLD', tradingViewSymbol: 'TVC:GOLD', name: 'Gold', price: 2789.45, change: 23.45, changePercent: 0.85 },
            { symbol: 'SILVER', tradingViewSymbol: 'TVC:SILVER', name: 'Silver', price: 31.23, change: 0.45, changePercent: 1.46 },
            { symbol: 'CRUDE', tradingViewSymbol: 'NYMEX:CL1!', name: 'Crude Oil', price: 72.34, change: -1.23, changePercent: -1.67 },
            { symbol: 'NATGAS', tradingViewSymbol: 'NYMEX:NG1!', name: 'Natural Gas', price: 2.89, change: 0.12, changePercent: 4.33 },
            { symbol: 'COPPER', tradingViewSymbol: 'COMEX:HG1!', name: 'Copper', price: 4.23, change: -0.08, changePercent: -1.86 },
        ]
    },
    {
        id: 'forex',
        name: 'Forex',
        icon: <DollarSign className="w-4 h-4" />,
        color: 'text-green-400',
        useAngelOne: false,
        tickers: [
            { symbol: 'EURUSD', tradingViewSymbol: 'FX:EURUSD', name: 'EUR/USD', price: 1.0345, change: 0.0023, changePercent: 0.22 },
            { symbol: 'GBPUSD', tradingViewSymbol: 'FX:GBPUSD', name: 'GBP/USD', price: 1.2456, change: -0.0045, changePercent: -0.36 },
            { symbol: 'USDJPY', tradingViewSymbol: 'FX:USDJPY', name: 'USD/JPY', price: 154.56, change: 0.78, changePercent: 0.51 },
            { symbol: 'USDINR', tradingViewSymbol: 'FX:USDINR', name: 'USD/INR', price: 86.45, change: 0.23, changePercent: 0.27 },
            { symbol: 'AUDUSD', tradingViewSymbol: 'FX:AUDUSD', name: 'AUD/USD', price: 0.6234, change: -0.0034, changePercent: -0.54 },
        ]
    },
];

interface WatchlistSidebarProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

export default function WatchlistSidebar({ isOpen = true, onToggle }: WatchlistSidebarProps) {
    const { setSelectedSymbol, setSymbolName } = useChart();
    const [watchlistData, setWatchlistData] = useState<WatchlistCategory[]>(createInitialWatchlistData);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        global: true,
        indian: true,
        crypto: false,
        commodities: false,
        forex: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Use auth context for connection state
    const { isLoggedIn, loginWithTOTP, logoutUser, isLoading: authLoading, error: authError } = useAngelOneAuth();

    // Fetch Indian stock data from Angel One
    const fetchIndianStocks = useCallback(async () => {
        if (!isLoggedIn) {
            // If not logged in, but credentials exist, show login modal
            if (hasCredentials()) {
                setShowLoginModal(true);
            }
            return;
        }

        setIsLoading(true);
        try {
            const tokens = Object.values(COMMON_TOKENS).map(t => t.symboltoken);
            const data = await getLTP({ NSE: tokens });

            // Create a map for quick lookup
            const priceMap = new Map<string, LTPData>();
            data.forEach(item => {
                priceMap.set(item.symboltoken, item);
            });

            // Update watchlist data
            setWatchlistData(prev => prev.map(category => {
                if (category.id !== 'indian') return category;

                return {
                    ...category,
                    tickers: category.tickers.map(ticker => {
                        if (!ticker.angelToken) return ticker;

                        const ltp = priceMap.get(ticker.angelToken);
                        if (!ltp) return ticker;

                        const change = ltp.ltp - ltp.close;
                        const changePercent = ltp.close > 0 ? (change / ltp.close) * 100 : 0;

                        return {
                            ...ticker,
                            price: ltp.ltp,
                            change,
                            changePercent,
                            isLive: true,
                        };
                    }),
                };
            }));

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch Indian stocks:', error);
            // If token is invalid (AG8001), force logout so user can re-login
            if (error instanceof Error && (error.message.includes('Invalid Token') || error.message.includes('AG8001'))) {
                console.warn('Session expired or invalid, logging out...');
                logoutUser();
            }
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn, logoutUser]);

    // Initial fetch and polling
    useEffect(() => {
        if (hasCredentials() && isLoggedIn) {
            fetchIndianStocks();

            // Poll every 10 seconds during market hours
            const interval = setInterval(fetchIndianStocks, 10000);
            return () => clearInterval(interval);
        }
    }, [fetchIndianStocks]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleTickerClick = (ticker: TickerItem) => {
        setSelectedSymbol(ticker.tradingViewSymbol);
        setSymbolName(ticker.name);
    };

    const formatPrice = (price: number) => {
        if (price === 0) return '---';
        if (price >= 1000) {
            return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return price.toFixed(price < 10 ? 4 : 2);
    };

    const formatChange = (change: number, percent: number) => {
        if (change === 0 && percent === 0) return '---';
        const sign = change >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-secondary/80 backdrop-blur-sm border border-border/50 rounded-l-lg p-2 hover:bg-primary/20 transition-colors"
                title="Open Watchlist"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="w-72 h-full bg-background/95 backdrop-blur-xl border-l border-border/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold">Watchlist</span>
                    {isLoggedIn && (
                        <span className="flex items-center gap-1 text-[9px] text-bullish">
                            <Wifi className="w-3 h-3" />
                            LIVE
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={fetchIndianStocks}
                        disabled={isLoading}
                        className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Refresh prices"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {watchlistData.map((category) => (
                    <div key={category.id} className="border-b border-border/20">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className={category.color}>{category.icon}</span>
                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {category.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 bg-secondary/50 px-1.5 rounded">
                                    {category.tickers.length}
                                </span>
                                {category.useAngelOne && isLoggedIn && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                                )}
                            </div>
                            {expandedCategories[category.id] ? (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                        </button>

                        {/* Ticker List */}
                        {expandedCategories[category.id] && (
                            <div className="pb-1">
                                {category.tickers.map((ticker) => (
                                    <button
                                        key={ticker.symbol}
                                        onClick={() => handleTickerClick(ticker)}
                                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-primary/10 transition-colors group"
                                    >
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium group-hover:text-primary transition-colors">
                                                    {ticker.symbol}
                                                </span>
                                                {ticker.isLive && (
                                                    <span className="w-1 h-1 rounded-full bg-bullish" />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                                {ticker.name}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-mono">
                                                {formatPrice(ticker.price)}
                                            </span>
                                            <span className={`text-[10px] font-mono ${ticker.change >= 0 ? 'text-bullish' : 'text-bearish'
                                                }`}>
                                                {formatChange(ticker.change, ticker.changePercent)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-border/30">
                <span>
                    {isLoggedIn ? (
                        <span className="flex items-center gap-1 text-bullish">
                            <Wifi className="w-3 h-3" />
                            Angel One Connected
                        </span>
                    ) : hasCredentials() ? (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            disabled={authLoading}
                        >
                            <WifiOff className="w-3 h-3" />
                            {authLoading ? 'Logging in...' : 'Click to Login'}
                        </button>
                    ) : (
                        'Configure .env for live data'
                    )}
                </span>
                {lastUpdate && (
                    <span>
                        {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            {/* Login Modal */}
            <AngelOneLoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSubmit={async (totp) => {
                    await loginWithTOTP(totp);
                    setShowLoginModal(false);
                }}
                isLoading={authLoading}
                error={authError}
            />
        </div>
    );
}
