import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface AgentStatus {
    name: string;
    status: "idle" | "running" | "success" | "error";
    duration_ms?: number;
    error?: string;
}

interface CycleResult {
    cycle_id: string;
    cycle_number: number;
    status: string;
    duration_ms: number;
    timestamp: string;
    summary: string;
    decision: {
        recommendations: any[];
        primary_action: any;
        confidence: number;
        market_regime: string;
        alignment: any;
        ai_reasoning: any;
        disclaimer: string;
    };
    alerts: any[];
    agents_completed: string[];
    errors: any[];
    market_data: {
        ltp: Record<string, number>;
        vix: number;
    };
    risk: {
        score: number;
        label: string;
    };
    sentiment: {
        score: number;
        label: string;
    };
    active_trades: {
        top: any[];
        pcr: Record<string, any>;
    };
}

interface OrchestratorStatus {
    running: boolean;
    cycle_count: number;
    in_market_hours: boolean;
    current_time: string;
    market_open: string;
    market_close: string;
    ollama_available: boolean;
    ollama_model: string;
    latest_cycle: string | null;
    latest_status: string | null;
}

interface AutoTradeState {
    status: OrchestratorStatus | null;
    latestCycle: CycleResult | null;
    cycleHistory: CycleResult[];
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    start: (intervalMins?: number) => Promise<void>;
    stop: () => Promise<void>;
    runCycle: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AutoTradeContext = createContext<AutoTradeState | null>(null);

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/autotrade";

export const AutoTradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<OrchestratorStatus | null>(null);
    const [latestCycle, setLatestCycle] = useState<CycleResult | null>(null);
    const [cycleHistory, setCycleHistory] = useState<CycleResult[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<NodeJS.Timeout | null>(null);

    // WebSocket connection
    const connectWS = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === "status") {
                        setStatus(msg.data);
                    } else if (msg.type === "cycle_result") {
                        setLatestCycle(msg.data);
                        setCycleHistory(prev => [msg.data, ...prev].slice(0, 50));
                    } else if (msg.type === "ping") {
                        // Keepalive
                    } else if (msg.cycle_id) {
                        // Direct cycle result broadcast
                        setLatestCycle(msg);
                        setCycleHistory(prev => [msg, ...prev].slice(0, 50));
                    }
                } catch (e) {
                    console.error("AutoTrade WS parse error:", e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Auto-reconnect after 5s
                reconnectRef.current = setTimeout(connectWS, 5000);
            };

            ws.onerror = () => {
                setIsConnected(false);
                setError("WebSocket connection failed. Is the backend running?");
            };

            wsRef.current = ws;
        } catch (e) {
            setError("Failed to connect to AutoTrade backend");
        }
    }, []);

    // Initialize
    useEffect(() => {
        fetchStatus();
        connectWS();

        return () => {
            wsRef.current?.close();
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };
    }, [connectWS]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/autotrade/status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (e) {
            // Backend not running — that's ok
        }
    };

    const fetchLatest = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/autotrade/latest`);
            if (res.ok) {
                const data = await res.json();
                if (data.cycle_id) setLatestCycle(data);
            }
        } catch (e) { /* silent */ }
    };

    const start = async (intervalMins = 5) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/autotrade/start?interval_mins=${intervalMins}`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.status === "started" || data.status === "already_running") {
                await fetchStatus();
            }
        } catch (e) {
            setError("Failed to start orchestrator");
        } finally {
            setIsLoading(false);
        }
    };

    const stop = async () => {
        setIsLoading(true);
        try {
            await fetch(`${API_BASE}/api/autotrade/stop`, { method: "POST" });
            await fetchStatus();
        } catch (e) {
            setError("Failed to stop orchestrator");
        } finally {
            setIsLoading(false);
        }
    };

    const runCycle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/autotrade/cycle`, { method: "POST" });
            const data = await res.json();
            if (data.cycle_id) {
                setLatestCycle(data);
                setCycleHistory(prev => [data, ...prev].slice(0, 50));
            }
            await fetchStatus();
        } catch (e) {
            setError("Failed to run cycle. Is the backend running?");
        } finally {
            setIsLoading(false);
        }
    };

    const refresh = async () => {
        await Promise.all([fetchStatus(), fetchLatest()]);
    };

    return (
        <AutoTradeContext.Provider
            value={{
                status,
                latestCycle,
                cycleHistory,
                isConnected,
                isLoading,
                error,
                start,
                stop,
                runCycle,
                refresh,
            }}
        >
            {children}
        </AutoTradeContext.Provider>
    );
};

export const useAutoTrade = () => {
    const ctx = useContext(AutoTradeContext);
    if (!ctx) throw new Error("useAutoTrade must be used within AutoTradeProvider");
    return ctx;
};

export type { CycleResult, OrchestratorStatus, AgentStatus };
