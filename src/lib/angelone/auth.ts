/**
 * Angel One SmartAPI Authentication Service
 * 
 * Handles login, session management, and token refresh.
 */

import { ANGEL_ONE_CONFIG, getCredentials } from './config';
import type { LoginResponse, AngelOneSession, UserProfile } from './types';

// Session storage key
const SESSION_KEY = 'angelone_session';

// Current session state
let currentSession: AngelOneSession | null = null;

/**
 * Generate TOTP from secret
 * Note: For browser environments, TOTP should be generated externally
 * (e.g., from authenticator app) and passed to login function
 */
export const generateTOTP = async (_secret: string): Promise<string> => {
    // In browser environment, user needs to provide TOTP from their authenticator app
    // This function is a placeholder - actual TOTP generation requires otplib package
    console.warn('TOTP auto-generation not available in browser. Please provide TOTP manually.');
    return '';
};

/**
 * Login to Angel One SmartAPI
 */
export const login = async (manualTOTP?: string): Promise<AngelOneSession> => {
    const creds = getCredentials();

    if (!creds.clientId || !creds.password || !creds.apiKey) {
        throw new Error('Missing Angel One credentials. Please configure .env file.');
    }

    // Generate or use provided TOTP
    let totp = manualTOTP || '';
    if (!totp && creds.totpSecret) {
        totp = await generateTOTP(creds.totpSecret);
    }

    if (!totp) {
        throw new Error('TOTP required for login. Please provide TOTP or configure TOTP_SECRET.');
    }

    const response = await fetch(`${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
            ...ANGEL_ONE_CONFIG.HEADERS,
            'X-PrivateKey': creds.apiKey,
        },
        body: JSON.stringify({
            clientcode: creds.clientId,
            password: creds.password,
            totp: totp,
        }),
    });

    const data: LoginResponse = await response.json();

    if (!data.status || !data.data) {
        throw new Error(data.message || 'Login failed');
    }

    // Create session
    const session: AngelOneSession = {
        jwtToken: data.data.jwtToken,
        refreshToken: data.data.refreshToken,
        feedToken: data.data.feedToken,
        clientId: creds.clientId,
        isAuthenticated: true,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    // Store session
    currentSession = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
};

/**
 * Get current session
 */
export const getSession = (): AngelOneSession | null => {
    if (currentSession) {
        return currentSession;
    }

    // Try to restore from localStorage
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        try {
            const session: AngelOneSession = JSON.parse(stored);
            // Check if expired
            if (session.expiresAt > Date.now()) {
                currentSession = session;
                return session;
            } else {
                // Session expired, clear it
                localStorage.removeItem(SESSION_KEY);
            }
        } catch {
            localStorage.removeItem(SESSION_KEY);
        }
    }

    return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    const session = getSession();
    return session !== null && session.isAuthenticated && session.expiresAt > Date.now();
};

/**
 * Get authorization headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
    const session = getSession();
    const creds = getCredentials();

    if (!session) {
        throw new Error('Not authenticated. Please login first.');
    }

    return {
        ...ANGEL_ONE_CONFIG.HEADERS,
        'Authorization': `Bearer ${session.jwtToken}`,
        'X-PrivateKey': creds.apiKey,
    };
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (): Promise<AngelOneSession> => {
    const session = getSession();

    if (!session) {
        throw new Error('No session to refresh');
    }

    const creds = getCredentials();

    const response = await fetch(`${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
            ...ANGEL_ONE_CONFIG.HEADERS,
            'X-PrivateKey': creds.apiKey,
        },
        body: JSON.stringify({
            refreshToken: session.refreshToken,
        }),
    });

    const data = await response.json();

    if (!data.status || !data.data) {
        // Refresh failed, need to re-login
        logout();
        throw new Error('Token refresh failed. Please login again.');
    }

    // Update session
    const updatedSession: AngelOneSession = {
        ...session,
        jwtToken: data.data.jwtToken,
        refreshToken: data.data.refreshToken,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };

    currentSession = updatedSession;
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));

    return updatedSession;
};

/**
 * Logout and clear session
 */
export const logout = async (): Promise<void> => {
    const session = getSession();

    if (session) {
        try {
            await fetch(`${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.LOGOUT}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    clientcode: session.clientId,
                }),
            });
        } catch {
            // Ignore logout errors
        }
    }

    currentSession = null;
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Get user profile
 */
export const getProfile = async (): Promise<UserProfile> => {
    const response = await fetch(`${ANGEL_ONE_CONFIG.BASE_URL}${ANGEL_ONE_CONFIG.ENDPOINTS.PROFILE}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!data.status || !data.data) {
        throw new Error(data.message || 'Failed to get profile');
    }

    return data.data;
};
