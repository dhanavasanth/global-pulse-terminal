/**
 * Angel One SmartAPI TypeScript Types
 * 
 * Type definitions for API requests and responses.
 */

// ============ Authentication Types ============

export interface LoginRequest {
    clientcode: string;
    password: string;
    totp: string;
}

export interface LoginResponse {
    status: boolean;
    message: string;
    errorcode: string;
    data: {
        jwtToken: string;
        refreshToken: string;
        feedToken: string;
    } | null;
}

export interface UserProfile {
    clientcode: string;
    name: string;
    email: string;
    mobileno: string;
    exchanges: string[];
    products: string[];
    broker: string;
}

// ============ Market Data Types ============

export type Exchange = 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDS' | 'BFO';

export interface SymbolToken {
    exchange: Exchange;
    tradingsymbol: string;
    symboltoken: string;
}

export interface LTPData {
    exchange: Exchange;
    tradingsymbol: string;
    symboltoken: string;
    open: number;
    high: number;
    low: number;
    close: number;
    ltp: number;
    percentChange: number;
}

export interface FullQuote extends LTPData {
    volume: number;
    avgprice: number;
    totalbuyqty: number;
    totalsellqty: number;
    opninterest: number;
    upperCircuit: number;
    lowerCircuit: number;
}

export interface MarketDataRequest {
    mode: 'LTP' | 'FULL' | 'OHLC';
    exchangeTokens: {
        [exchange: string]: string[];
    };
}

export interface MarketDataResponse {
    status: boolean;
    message: string;
    errorcode: string;
    data: {
        fetched: LTPData[] | FullQuote[];
        unfetched: string[];
    };
}

// ============ Options Chain Types ============

export interface OptionContract {
    strikePrice: number;
    expiryDate: string;
    optionType: 'CE' | 'PE';
    symboltoken: string;
    tradingsymbol: string;
    ltp: number;
    change: number;
    changePercent: number;
    volume: number;
    oi: number;
    oiChange: number;
    iv: number;
    // Greeks
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
}

export interface OptionChainData {
    underlying: string;
    underlyingPrice: number;
    expiryDate: string;
    contracts: OptionContract[];
    atmStrike: number;
}

// ============ WebSocket Types ============

export type WebSocketMode = 1 | 2 | 3; // 1=LTP, 2=Quote, 3=SnapQuote

export interface WebSocketSubscription {
    correlationID: string;
    action: 1 | 0; // 1=subscribe, 0=unsubscribe
    params: {
        mode: WebSocketMode;
        tokenList: {
            exchangeType: number;
            tokens: string[];
        }[];
    };
}

export interface WebSocketTick {
    exchange: number;
    token: string;
    ltp: number;
    lastTradedQty: number;
    avgTradedPrice: number;
    volume: number;
    totalBuyQty: number;
    totalSellQty: number;
    open: number;
    high: number;
    low: number;
    close: number;
    oi: number;
}

// ============ Symbol Master Types ============

export interface InstrumentMaster {
    token: string;
    symbol: string;
    name: string;
    expiry: string;
    strike: number;
    lotsize: number;
    instrumenttype: string;
    exch_seg: Exchange;
    tick_size: number;
}

// ============ Session State ============

export interface AngelOneSession {
    jwtToken: string;
    refreshToken: string;
    feedToken: string;
    clientId: string;
    isAuthenticated: boolean;
    expiresAt: number;
}

// ============ API Error ============

export interface APIError {
    status: boolean;
    message: string;
    errorcode: string;
}

// ============ Symbol Mapping ============

// Common NIFTY/BANKNIFTY tokens
export const COMMON_TOKENS: Record<string, SymbolToken> = {
    'NIFTY': { exchange: 'NSE', tradingsymbol: 'NIFTY 50', symboltoken: '99926000' },
    'BANKNIFTY': { exchange: 'NSE', tradingsymbol: 'NIFTY BANK', symboltoken: '99926009' },
    'SENSEX': { exchange: 'BSE', tradingsymbol: 'SENSEX', symboltoken: '99919000' },
    'RELIANCE': { exchange: 'NSE', tradingsymbol: 'RELIANCE-EQ', symboltoken: '2885' },
    'TCS': { exchange: 'NSE', tradingsymbol: 'TCS-EQ', symboltoken: '11536' },
    'INFY': { exchange: 'NSE', tradingsymbol: 'INFY-EQ', symboltoken: '1594' },
    'HDFCBANK': { exchange: 'NSE', tradingsymbol: 'HDFCBANK-EQ', symboltoken: '1333' },
    'ICICIBANK': { exchange: 'NSE', tradingsymbol: 'ICICIBANK-EQ', symboltoken: '4963' },
    'SBIN': { exchange: 'NSE', tradingsymbol: 'SBIN-EQ', symboltoken: '3045' },
    'BHARTIARTL': { exchange: 'NSE', tradingsymbol: 'BHARTIARTL-EQ', symboltoken: '10604' },
    'ITC': { exchange: 'NSE', tradingsymbol: 'ITC-EQ', symboltoken: '1660' },
    'KOTAKBANK': { exchange: 'NSE', tradingsymbol: 'KOTAKBANK-EQ', symboltoken: '1922' },
    'LT': { exchange: 'NSE', tradingsymbol: 'LT-EQ', symboltoken: '11483' },
};
