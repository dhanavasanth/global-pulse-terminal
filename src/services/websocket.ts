/**
 * WebSocket Service for Real-Time Market Data
 * Production-grade implementation with reconnection, error handling, and cleanup
 */

import { useOrderflowStore } from '../store/orderflowStore';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface WebSocketConfig {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private currentSymbol: string = '';
    private connectionState: ConnectionState = 'disconnected';
    private reconnectAttempts: number = 0;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private isIntentionalClose: boolean = false;

    private readonly config: WebSocketConfig = {
        url: 'ws://localhost:8000/ws',
        reconnectInterval: 2000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 25000,
    };

    /**
     * Connect to WebSocket server for a specific symbol
     */
    connect(symbol: string): void {
        // Cleanup existing connection if symbol changed
        if (this.ws && this.currentSymbol !== symbol) {
            this.disconnect();
        }

        // Skip if already connected to same symbol
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentSymbol === symbol) {
            console.log(`Already connected to ${symbol}`);
            return;
        }

        this.isIntentionalClose = false;
        this.currentSymbol = symbol;
        this.connectionState = 'connecting';

        const wsUrl = `${this.config.url}/${symbol}`;
        console.log(`🔌 Connecting to ${wsUrl}...`);

        try {
            this.ws = new WebSocket(wsUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    private setupEventHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log(`✅ Connected to ${this.currentSymbol}`);
            this.connectionState = 'connected';
            this.reconnectAttempts = 0;
            useOrderflowStore.getState().setConnectionStatus(true);
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        this.ws.onclose = (event) => {
            console.log(`🔌 Disconnected (code: ${event.code}, reason: ${event.reason || 'none'})`);
            this.cleanup();
            useOrderflowStore.getState().setConnectionStatus(false);

            if (!this.isIntentionalClose) {
                this.scheduleReconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Don't close here - let onclose handle cleanup
        };
    }

    private handleMessage(data: any): void {
        const store = useOrderflowStore.getState();

        switch (data.type) {
            case 'orderbook':
                store.updateOrderbook(data.bids, data.asks, data.midPrice, data.spread);
                break;

            case 'trade':
                store.addTrade({
                    id: data.id,
                    price: data.price,
                    size: data.size,
                    side: data.side,
                    timestamp: data.timestamp,
                });
                break;

            case 'ping':
                // Server heartbeat - respond to keep connection alive
                this.send({ type: 'pong' });
                break;

            default:
                console.debug('Unknown message type:', data.type);
        }
    }

    private send(data: object): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({ type: 'heartbeat' });
            }
        }, this.config.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.connectionState = 'disconnected';
            return;
        }

        this.connectionState = 'reconnecting';
        this.reconnectAttempts++;

        const delay = this.config.reconnectInterval * Math.min(this.reconnectAttempts, 5);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            if (this.currentSymbol) {
                this.connect(this.currentSymbol);
            }
        }, delay);
    }

    private cleanup(): void {
        this.stopHeartbeat();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    /**
     * Gracefully disconnect from WebSocket server
     */
    disconnect(): void {
        console.log('🔌 Disconnecting WebSocket...');
        this.isIntentionalClose = true;
        this.cleanup();

        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close(1000, 'Client disconnect');
            }
            this.ws = null;
        }

        this.connectionState = 'disconnected';
        this.currentSymbol = '';
        useOrderflowStore.getState().setConnectionStatus(false);
    }

    /**
     * Get current connection state
     */
    getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Get current symbol
     */
    getCurrentSymbol(): string {
        return this.currentSymbol;
    }
}

// Singleton instance
export const wsService = new WebSocketService();
