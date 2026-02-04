/**
 * Angel One SmartAPI Configuration
 * 
 * Handles API credentials and base configuration.
 */

// Use proxy in development to bypass CORS, direct URL in production
const isDev = import.meta.env.DEV;

// API Endpoints
export const ANGEL_ONE_CONFIG = {
    // In dev mode, use Vite proxy; in production, use direct URL
    BASE_URL: isDev ? '/api/angelone' : 'https://apiconnect.angelbroking.com',
    WS_URL: 'wss://smartapisocket.angelone.in/smart-stream',

    // Endpoints
    ENDPOINTS: {
        LOGIN: '/rest/auth/angelbroking/user/v1/loginByPassword',
        LOGOUT: '/rest/secure/angelbroking/user/v1/logout',
        REFRESH_TOKEN: '/rest/auth/angelbroking/jwt/v1/generateTokens',
        PROFILE: '/rest/secure/angelbroking/user/v1/getProfile',
        LTP: '/rest/secure/angelbroking/market/v1/quote/',
        MARKET_DATA: '/rest/secure/angelbroking/market/v1/quote',
        OPTION_CHAIN: '/rest/secure/angelbroking/market/v1/optionchain',
        SEARCH_SCRIP: '/rest/secure/angelbroking/order/v1/searchScrip',
    },

    // Headers
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '',
        'X-ClientPublicIP': '',
        'X-MACAddress': '',
    }
};


/**
 * Get credentials from environment variables
 */
export const getCredentials = () => {
    return {
        apiKey: import.meta.env.VITE_ANGELONE_API_KEY || '',
        clientId: import.meta.env.VITE_ANGELONE_CLIENT_ID || '',
        password: import.meta.env.VITE_ANGELONE_PASSWORD || '',
        totpSecret: import.meta.env.VITE_ANGELONE_TOTP_SECRET || '',
    };
};

/**
 * Check if credentials are configured
 */
export const hasCredentials = (): boolean => {
    const creds = getCredentials();
    return !!(creds.apiKey && creds.clientId && creds.password);
};

/**
 * Exchange type mapping for WebSocket
 */
export const EXCHANGE_MAP: Record<string, number> = {
    'NSE': 1,
    'NFO': 2,
    'BSE': 3,
    'BFO': 4,
    'MCX': 5,
    'NCX': 7,
    'CDS': 13,
};

/**
 * Reverse exchange mapping
 */
export const EXCHANGE_REVERSE_MAP: Record<number, string> = {
    1: 'NSE',
    2: 'NFO',
    3: 'BSE',
    4: 'BFO',
    5: 'MCX',
    7: 'NCX',
    13: 'CDS',
};
