/**
 * Angel One SmartAPI - Main Export
 */

// Authentication
export {
    login,
    logout,
    getSession,
    isAuthenticated,
    getAuthHeaders,
    getProfile,
    refreshToken
} from './auth';

// Configuration
export {
    ANGEL_ONE_CONFIG,
    getCredentials,
    hasCredentials,
    EXCHANGE_MAP,
    EXCHANGE_REVERSE_MAP
} from './config';

// Market Data
export {
    getLTP,
    getFullQuote,
    getOHLC,
    searchScrip,
    getOptionChain,
    getIndianStockLTP,
    getIndianIndicesQuote,
    calculateChange
} from './marketData';

// WebSocket
export { angelOneWS, AngelOneWebSocket } from './websocket';

// Types
export type {
    LoginRequest,
    LoginResponse,
    UserProfile,
    Exchange,
    SymbolToken,
    LTPData,
    FullQuote,
    MarketDataRequest,
    MarketDataResponse,
    OptionContract,
    OptionChainData,
    WebSocketMode,
    WebSocketSubscription,
    WebSocketTick,
    InstrumentMaster,
    AngelOneSession,
    APIError,
} from './types';

export { COMMON_TOKENS } from './types';
