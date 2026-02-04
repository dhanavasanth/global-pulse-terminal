/**
 * Angel One Authentication Context
 * 
 * Provides authentication state and login/logout methods to the entire app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login, logout, isAuthenticated, getSession, hasCredentials } from '@/lib/angelone';
import type { AngelOneSession } from '@/lib/angelone';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    session: AngelOneSession | null;
    error: string | null;
    loginWithTOTP: (totp: string) => Promise<void>;
    logoutUser: () => Promise<void>;
    retryLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AngelOneAuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<AngelOneSession | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [totpPromptShown, setTotpPromptShown] = useState(false);

    // Check existing session on mount
    useEffect(() => {
        const existingSession = getSession();
        if (existingSession && isAuthenticated()) {
            setSession(existingSession);
            setIsLoggedIn(true);
        }
        setIsLoading(false);
    }, []);

    // Auto-login if credentials available and TOTP_SECRET is set
    useEffect(() => {
        if (isLoggedIn || !hasCredentials()) {
            return;
        }

        const attemptAutoLogin = async () => {
            const totpSecret = import.meta.env.VITE_ANGELONE_TOTP_SECRET;

            if (totpSecret && totpSecret !== 'your_totp_secret_for_auto_login') {
                // Generate TOTP and login automatically
                // Note: For browser, we'll prompt for TOTP since we removed otplib
                if (!totpPromptShown) {
                    setTotpPromptShown(true);
                    const userTOTP = prompt('Enter your Angel One TOTP (from authenticator app):');
                    if (userTOTP) {
                        await loginWithTOTP(userTOTP);
                    }
                }
            }
        };

        attemptAutoLogin();
    }, [isLoggedIn, totpPromptShown]);

    const loginWithTOTP = useCallback(async (totp: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const newSession = await login(totp);
            setSession(newSession);
            setIsLoggedIn(true);
            console.log('✅ Angel One login successful!');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            console.error('❌ Angel One login failed:', message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logoutUser = useCallback(async () => {
        setIsLoading(true);
        try {
            await logout();
            setSession(null);
            setIsLoggedIn(false);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const retryLogin = useCallback(() => {
        setTotpPromptShown(false);
        setError(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            isLoading,
            session,
            error,
            loginWithTOTP,
            logoutUser,
            retryLogin,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAngelOneAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAngelOneAuth must be used within AngelOneAuthProvider');
    }
    return context;
};
