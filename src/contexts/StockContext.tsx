/**
 * Stock Context - Global state for stock data
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api';

// Types
export interface StockProfile {
    symbol: string;
    companyName: string;
    exchange: string;
    industry: string;
    sector: string;
    description: string;
    ceo: string;
    website: string;
    image: string;
    price: number;
    changes: number;
    changesPercentage: number;
    mktCap: number;
    volAvg: number;
    range: string;
    beta: number;
    lastDiv: number;
    dcfDiff: number;
    dcf: number;
    ipoDate: string;
    country: string;
    city: string;
    state: string;
    fullTimeEmployees: string;
    isEtf: boolean;
    isActivelyTrading: boolean;
}

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    changesPercentage: number;
    change: number;
    dayLow: number;
    dayHigh: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    priceAvg50: number;
    priceAvg200: number;
    volume: number;
    avgVolume: number;
    open: number;
    previousClose: number;
    eps: number;
    pe: number;
    earningsAnnouncement: string;
    sharesOutstanding: number;
    timestamp: number;
}

export interface KeyMetrics {
    peRatioTTM: number;
    pegRatioTTM: number;
    payoutRatioTTM: number;
    currentRatioTTM: number;
    quickRatioTTM: number;
    cashRatioTTM: number;
    daysOfSalesOutstandingTTM: number;
    daysOfInventoryOutstandingTTM: number;
    operatingCycleTTM: number;
    daysOfPayablesOutstandingTTM: number;
    cashConversionCycleTTM: number;
    grossProfitMarginTTM: number;
    operatingProfitMarginTTM: number;
    pretaxProfitMarginTTM: number;
    netProfitMarginTTM: number;
    effectiveTaxRateTTM: number;
    returnOnAssetsTTM: number;
    returnOnEquityTTM: number;
    returnOnCapitalEmployedTTM: number;
    netIncomePerEBTTTM: number;
    ebtPerEbitTTM: number;
    ebitPerRevenueTTM: number;
    debtRatioTTM: number;
    debtEquityRatioTTM: number;
    longTermDebtToCapitalizationTTM: number;
    totalDebtToCapitalizationTTM: number;
    interestCoverageTTM: number;
    cashFlowToDebtRatioTTM: number;
    companyEquityMultiplierTTM: number;
    receivablesTurnoverTTM: number;
    payablesTurnoverTTM: number;
    inventoryTurnoverTTM: number;
    fixedAssetTurnoverTTM: number;
    assetTurnoverTTM: number;
    operatingCashFlowPerShareTTM: number;
    freeCashFlowPerShareTTM: number;
    cashPerShareTTM: number;
    operatingCashFlowSalesRatioTTM: number;
    freeCashFlowOperatingCashFlowRatioTTM: number;
    cashFlowCoverageRatiosTTM: number;
    shortTermCoverageRatiosTTM: number;
    capitalExpenditureCoverageRatioTTM: number;
    dividendPaidAndCapexCoverageRatioTTM: number;
    priceToBookRatioTTM: number;
    priceToSalesRatioTTM: number;
    priceEarningsRatioTTM: number;
    priceToFreeCashFlowsRatioTTM: number;
    priceToOperatingCashFlowsRatioTTM: number;
    priceCashFlowRatioTTM: number;
    priceEarningsToGrowthRatioTTM: number;
    priceSalesRatioTTM: number;
    dividendYieldTTM: number;
    enterpriseValueMultipleTTM: number;
    priceFairValueTTM: number;
    dividendPerShareTTM: number;
}

interface StockContextValue {
    // State
    symbol: string;
    profile: StockProfile | null;
    quote: StockQuote | null;
    keyMetrics: KeyMetrics | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setSymbol: (symbol: string) => void;
    searchSymbols: (query: string) => Promise<any[]>;
    fetchProfile: (symbol: string) => Promise<StockProfile | null>;
    fetchQuote: (symbol: string) => Promise<StockQuote | null>;
    fetchKeyMetrics: (symbol: string) => Promise<KeyMetrics | null>;
    fetchData: (endpoint: string, symbol: string) => Promise<any>;
}

const StockContext = createContext<StockContextValue | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
    const [symbol, setSymbolState] = useState('AAPL');
    const [profile, setProfile] = useState<StockProfile | null>(null);
    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generic fetch function
    const fetchData = useCallback(async (endpoint: string, sym: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE}/stock/${endpoint}/${sym}`);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error(`Error fetching ${endpoint}:`, err);
            throw err;
        }
    }, []);

    // Search symbols
    const searchSymbols = useCallback(async (query: string): Promise<any[]> => {
        if (!query || query.length < 1) return [];
        try {
            const response = await fetch(`${API_BASE}/stock/search?q=${encodeURIComponent(query)}&limit=10`);
            if (!response.ok) return [];
            return await response.json();
        } catch (err) {
            console.error('Search error:', err);
            return [];
        }
    }, []);

    // Fetch profile
    const fetchProfile = useCallback(async (sym: string): Promise<StockProfile | null> => {
        try {
            const data = await fetchData('profile', sym);
            setProfile(data);
            return data;
        } catch (err) {
            setProfile(null);
            return null;
        }
    }, [fetchData]);

    // Fetch quote
    const fetchQuote = useCallback(async (sym: string): Promise<StockQuote | null> => {
        try {
            const data = await fetchData('quote', sym);
            setQuote(data);
            return data;
        } catch (err) {
            setQuote(null);
            return null;
        }
    }, [fetchData]);

    // Fetch key metrics
    const fetchKeyMetrics = useCallback(async (sym: string): Promise<KeyMetrics | null> => {
        try {
            const data = await fetchData('key-metrics-ttm', sym);
            setKeyMetrics(data);
            return data;
        } catch (err) {
            setKeyMetrics(null);
            return null;
        }
    }, [fetchData]);

    // Set symbol and fetch data
    const setSymbol = useCallback(async (newSymbol: string) => {
        if (!newSymbol) return;

        setSymbolState(newSymbol.toUpperCase());
        setIsLoading(true);
        setError(null);

        try {
            await Promise.all([
                fetchProfile(newSymbol),
                fetchQuote(newSymbol),
                fetchKeyMetrics(newSymbol)
            ]);
        } catch (err) {
            setError('Failed to load stock data');
        } finally {
            setIsLoading(false);
        }
    }, [fetchProfile, fetchQuote, fetchKeyMetrics]);

    return (
        <StockContext.Provider value={{
            symbol,
            profile,
            quote,
            keyMetrics,
            isLoading,
            error,
            setSymbol,
            searchSymbols,
            fetchProfile,
            fetchQuote,
            fetchKeyMetrics,
            fetchData
        }}>
            {children}
        </StockContext.Provider>
    );
}

export function useStock() {
    const context = useContext(StockContext);
    if (!context) {
        throw new Error('useStock must be used within a StockProvider');
    }
    return context;
}

export default StockContext;
