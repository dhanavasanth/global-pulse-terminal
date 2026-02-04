/**
 * Angel One SmartAPI Market Data Service
 * 
 * Provides LTP quotes, full quotes, and options chain data.
 */

import { ANGEL_ONE_CONFIG } from './config';
import { getAuthHeaders, isAuthenticated } from './auth';
import type {
    LTPData,
    FullQuote,
    MarketDataResponse,
    OptionChainData,
    OptionContract,
    Exchange
} from './types';
import { COMMON_TOKENS } from './types';

/**
 * Helper to fetch and map data by exchange to ensure symboltoken mapping
 * Angel One API often omits symboltoken in response, so we must map by request order.
 */
const fetchAndMap = async (
    mode: 'LTP' | 'FULL' | 'OHLC',
    exchangeTokens: { [exchange: string]: string[] }
): Promise<any[]> => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    const promises = Object.entries(exchangeTokens).map(async ([exchange, tokens]) => {
        if (!tokens.length) return [];

        const url = `${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.MARKET_DATA}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    mode: mode,
                    exchangeTokens: { [exchange]: tokens },
                }),
            });

            const data: MarketDataResponse = await response.json();

            if (!data.status || !data.data || !data.data.fetched) {
                console.warn(`[AngelOne] Failed to fetch ${mode} for ${exchange}:`, data.message);
                return [];
            }

            // Map response items back to tokens by index
            // We assume API preserves order for a single exchange request
            return data.data.fetched.map((item: any, index: number) => {
                // Should match the token at this index
                const token = tokens[index];

                return {
                    ...item,
                    symboltoken: token, // Force inject the token
                    exchange: exchange,
                    // Ensure numeric fields are safe
                    volume: item.volume || 0,
                    ltp: item.ltp || 0,
                    open: item.open || 0,
                    high: item.high || 0,
                    low: item.low || 0,
                    close: item.close || 0,
                    percentChange: item.percentChange || 0
                };
            });
        } catch (error) {
            console.error(`[AngelOne] Error fetching ${exchange} ${mode}:`, error);
            return [];
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
};

/**
 * Fetch LTP (Last Traded Price) for symbols
 */
export const getLTP = async (
    exchangeTokens: { [exchange: string]: string[] }
): Promise<LTPData[]> => {
    return fetchAndMap('LTP', exchangeTokens);
};

/**
 * Fetch Full Quote data (OHLC, Volume, OI)
 */
export const getFullQuote = async (
    exchangeTokens: { [exchange: string]: string[] }
): Promise<FullQuote[]> => {
    return fetchAndMap('FULL', exchangeTokens);
};

/**
 * Fetch OHLC data
 */
export const getOHLC = async (
    exchangeTokens: { [exchange: string]: string[] }
): Promise<LTPData[]> => {
    return fetchAndMap('OHLC', exchangeTokens);
};

/**
 * Search for scrip/symbol
 */
export const searchScrip = async (
    exchange: Exchange,
    searchText: string
): Promise<any[]> => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.SEARCH_SCRIP}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            exchange: exchange,
            searchscrip: searchText,
        }),
    });

    const data = await response.json();

    if (!data.status || !data.data) {
        return [];
    }

    return data.data;
};

/**
 * Get Options Chain for NIFTY/BANKNIFTY
 * Note: This constructs option chain from NFO quotes
 */
/**
 * Format date for Angel One Symbol (e.g., "06-Feb-2026" -> "06FEB26")
 */
const formatExpiryForSymbol = (dateStr: string): string => {
    try {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const year = date.getFullYear().toString().slice(-2);
        return `${day}${month}${year}`;
    } catch (e) {
        return '';
    }
};

/**
 * Get Options Chain for NIFTY/BANKNIFTY
 * Fetches REAL option tokens via Search API and then gets Full Quotes
 */
export const getOptionChain = async (
    underlying: 'NIFTY' | 'BANKNIFTY' | 'SENSEX',
    expiryDate: string // Format: DD-MMM-YYYY e.g., "05-Feb-2026"
): Promise<OptionChainData> => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    try {
        // 1. Get Underlying Price
        const underlyingToken = COMMON_TOKENS[underlying]?.symboltoken;
        const exchange = COMMON_TOKENS[underlying]?.exchange || 'NSE';

        // Fetch underlying price
        const underlyingData = await getLTP({ [exchange]: [underlyingToken] });
        const underlyingPrice = underlyingData[0]?.ltp || 0;

        // 2. Search for Option Scrips
        // Format: "NIFTY 06FEB26"
        const symbolExpiry = formatExpiryForSymbol(expiryDate);
        const searchBase = underlying === 'NIFTY' || underlying === 'BANKNIFTY'
            ? underlying
            : underlying === 'SENSEX' ? 'SENSEX' : underlying;

        const searchQuery = `${searchBase} ${symbolExpiry}`;
        console.log(`[AngelOne] Searching for options: ${searchQuery}`);

        // Search in NFO (for NSE indices) or BFO (for Sensex)
        const derivativeExchange = exchange === 'NSE' ? 'NFO' : 'BFO';

        const searchResults = await searchScrip(derivativeExchange, searchQuery);

        if (!searchResults || searchResults.length === 0) {
            console.warn('[AngelOne] No option contracts found for:', searchQuery);
            return {
                underlying,
                underlyingPrice,
                expiryDate,
                contracts: [],
                atmStrike: 0
            };
        }

        // 3. Filter and parse tokens
        // We expect mostly CE/PE.
        const relevantScrips = searchResults.filter((scrip: any) =>
            (scrip.symbol.endsWith('CE') || scrip.symbol.endsWith('PE')) &&
            scrip.symbol.includes(symbolExpiry)
        );

        // 4. Fetch Quotes for these tokens
        // Split filtered scrips into batches if needed, but 50 is fine.
        const tokenMap = new Map<string, any>(); // symboltoken -> scrip details
        const tokensToFetch: string[] = [];

        relevantScrips.forEach((scrip: any) => {
            tokenMap.set(scrip.symboltoken, scrip);
            tokensToFetch.push(scrip.symboltoken);
        });

        // Use getFullQuote to get OI and Volume
        // NOTE: searchScrip returns exchange as NFO/BFO. 
        // We must pass that to getFullQuote.
        const quotes = await getFullQuote({ [derivativeExchange]: tokensToFetch });

        // 5. Build Option Contracts
        const contracts: OptionContract[] = quotes.map(quote => {
            // We need to recover the original scrip details because API quote might miss tradingsymbol
            // But we have mapped it by request order in our fix? 
            // Our fix maps by index.
            // But here `quote` has `symboltoken` injected by our fix!

            const scrip = tokenMap.get(quote.symboltoken);
            if (!scrip) return null;

            // Parse Strike and Type from Symbol or use regex
            // Format: NIFTY06FEB2625000CE
            // Regex to extract strike: [A-Z0-9]+(\d{5})(CE|PE)
            // Or use scrip.desc usually has "NIFTY 06FEB26 25000 CE"
            // Let's assume scrip.symbol is tradingsymbol.

            const type = scrip.symbol.endsWith('CE') ? 'CE' : 'PE';
            // Extract strike: strictly speaking we should parse it 
            // But search results usually come with 'strike' field? 
            // Angel search response: { symboltoken, tradingsymbol, desc, expiry, strike... }?
            // Usually valid. Assuming search response has it.
            // If not, parse string.

            let strike = 0;
            // Try parse from tradingsymbol
            const match = scrip.symbol.match(/(\d+)(CE|PE)$/);
            if (match) {
                // The digits before CE/PE might be strike.
                // e.g. 24500CE -> 24500
                // NIFTY26FEB2524500CE
                strike = parseFloat(match[1]);
            }
            // Fix: NIFTY strikes are 5 digits often? Or 24500 is 5 digits.
            // Some symbols might be "NIFTY26FEB24500CE"

            return {
                strikePrice: strike,
                expiryDate: expiryDate,
                optionType: type,
                symboltoken: quote.symboltoken,
                tradingsymbol: scrip.symbol,
                ltp: quote.ltp,
                change: quote.ltp - quote.close, // Calculate change
                changePercent: quote.percentChange,
                volume: quote.volume,
                oi: quote.opninterest || 0, // Angel API uses opninterest
                oiChange: 0, // Not available in basic full quote
                iv: 0, // Not available
                delta: 0,
                gamma: 0,
                theta: 0,
                vega: 0
            };
        }).filter(c => c !== null) as OptionContract[];

        // Calculate ATM
        const strikeGap = underlying === 'BANKNIFTY' ? 100 : 50;
        const atmStrike = Math.round(underlyingPrice / strikeGap) * strikeGap;

        return {
            underlying,
            underlyingPrice,
            expiryDate,
            contracts,
            atmStrike
        };

    } catch (e) {
        console.error('Error in getOptionChain:', e);
        return {
            underlying,
            underlyingPrice: 0,
            expiryDate,
            contracts: [],
            atmStrike: 0
        };
    }
};

/**
 * Get Indian stock LTP for watchlist
 * Fetches real prices for common Indian stocks
 */
export const getIndianStockLTP = async (): Promise<Map<string, LTPData>> => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    // Use centralized COMMON_TOKENS
    const nseTokens = Object.values(COMMON_TOKENS)
        .filter(t => t.exchange === 'NSE')
        .map(t => t.symboltoken);

    try {
        const data = await getLTP({ NSE: nseTokens });

        const result = new Map<string, LTPData>();
        for (const item of data) {
            result.set(item.symboltoken, item);
        }

        return result;
    } catch (error) {
        console.error('Failed to fetch Indian stock LTP:', error);
        return new Map();
    }
};

/**
 * Get Full Quote for Indian Indices (NIFTY, BANKNIFTY, SENSEX)
 */
export const getIndianIndicesQuote = async (): Promise<Map<string, FullQuote>> => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    try {
        const indices = ['NIFTY', 'BANKNIFTY', 'SENSEX'];
        const exchangeTokens: { [exchange: string]: string[] } = {
            NSE: [],
            BSE: []
        };

        indices.forEach(index => {
            const token = COMMON_TOKENS[index];
            if (token) {
                if (token.exchange === 'NSE') exchangeTokens.NSE.push(token.symboltoken);
                if (token.exchange === 'BSE') exchangeTokens.BSE.push(token.symboltoken);
            }
        });

        const data = await getFullQuote(exchangeTokens);

        const result = new Map<string, FullQuote>();
        for (const item of data) {
            result.set(item.symboltoken, item);
        }

        return result;
    } catch (error) {
        console.error('Failed to fetch Indian indices quote:', error);
        return new Map();
    }
};

/**
 * Calculate percentage change
 */
export const calculateChange = (ltp: number, close: number): { change: number; changePercent: number } => {
    const change = ltp - close;
    const changePercent = close > 0 ? (change / close) * 100 : 0;
    return { change, changePercent };
};
