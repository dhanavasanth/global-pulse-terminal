/**
 * Angel One Login Modal
 * Simple dialog for TOTP input
 */

import { useState } from 'react';
import { X, Key, Loader2 } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (totp: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export default function AngelOneLoginModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    error
}: LoginModalProps) {
    const [totp, setTotp] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totp.length === 6) {
            await onSubmit(totp);
            setTotp('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <Key className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">Angel One Login</h3>
                            <p className="text-xs text-muted-foreground">Enter TOTP from authenticator</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            6-Digit TOTP Code
                        </label>
                        <input
                            type="text"
                            value={totp}
                            onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={totp.length !== 6 || isLoading}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            'Login to Angel One'
                        )}
                    </button>

                    <p className="text-[10px] text-muted-foreground text-center">
                        Get the code from your Google Authenticator or TOTP app
                    </p>
                </form>
            </div>
        </div>
    );
}
