/**
 * Angel One SmartAPI WebSocket Service
 * 
 * Real-time streaming for live market data.
 */

import { ANGEL_ONE_CONFIG, EXCHANGE_MAP } from './config';
import { getSession } from './auth';
import type { WebSocketTick, WebSocketSubscription, WebSocketMode } from './types';

type TickCallback = (tick: WebSocketTick) => void;
type ConnectionCallback = (connected: boolean) => void;

class AngelOneWebSocket {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private subscriptions: Map<string, WebSocketSubscription> = new Map();
    private tickCallbacks: TickCallback[] = [];
    private connectionCallbacks: ConnectionCallback[] = [];

    /**
     * Connect to WebSocket
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const session = getSession();

            if (!session) {
                reject(new Error('Not authenticated. Please login first.'));
                return;
            }

            // Construct WebSocket URL with auth
            const wsUrl = `${ANGEL_ONE_CONFIG.WS_URL}?clientCode=${session.clientId}&feedToken=${session.feedToken}&apiKey=${session.jwtToken}`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Angel One WebSocket connected');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.notifyConnectionChange(true);

                // Re-subscribe to previous subscriptions
                this.resubscribe();

                resolve();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.stopHeartbeat();
                this.notifyConnectionChange(false);
                this.attemptReconnect();
            };
        });
    }

    /**
     * Disconnect WebSocket
     */
    disconnect(): void {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Subscribe to symbols
     */
    subscribe(
        mode: WebSocketMode,
        exchangeTokens: { [exchange: string]: string[] }
    ): void {
        const tokenList = Object.entries(exchangeTokens).map(([exchange, tokens]) => ({
            exchangeType: EXCHANGE_MAP[exchange] || 1,
            tokens: tokens,
        }));

        const subscription: WebSocketSubscription = {
            correlationID: `sub_${Date.now()}`,
            action: 1, // Subscribe
            params: {
                mode: mode,
                tokenList: tokenList,
            },
        };

        // Store subscription for reconnection
        const key = JSON.stringify(exchangeTokens);
        this.subscriptions.set(key, subscription);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(subscription));
        }
    }

    /**
     * Unsubscribe from symbols
     */
    unsubscribe(exchangeTokens: { [exchange: string]: string[] }): void {
        const tokenList = Object.entries(exchangeTokens).map(([exchange, tokens]) => ({
            exchangeType: EXCHANGE_MAP[exchange] || 1,
            tokens: tokens,
        }));

        const unsubscription: WebSocketSubscription = {
            correlationID: `unsub_${Date.now()}`,
            action: 0, // Unsubscribe
            params: {
                mode: 1,
                tokenList: tokenList,
            },
        };

        // Remove from stored subscriptions
        const key = JSON.stringify(exchangeTokens);
        this.subscriptions.delete(key);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(unsubscription));
        }
    }

    /**
     * Register tick callback
     */
    onTick(callback: TickCallback): () => void {
        this.tickCallbacks.push(callback);
        return () => {
            const index = this.tickCallbacks.indexOf(callback);
            if (index > -1) {
                this.tickCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Register connection status callback
     */
    onConnectionChange(callback: ConnectionCallback): () => void {
        this.connectionCallbacks.push(callback);
        return () => {
            const index = this.connectionCallbacks.indexOf(callback);
            if (index > -1) {
                this.connectionCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    // Private methods

    private handleMessage(data: any): void {
        try {
            // Angel One sends binary data, need to parse
            if (data instanceof ArrayBuffer) {
                const tick = this.parseBinaryTick(data);
                if (tick) {
                    this.notifyTick(tick);
                }
            } else if (typeof data === 'string') {
                const parsed = JSON.parse(data);
                // Handle different message types
                if (parsed.type === 'tick') {
                    this.notifyTick(parsed.data);
                }
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    private parseBinaryTick(buffer: ArrayBuffer): WebSocketTick | null {
        // Angel One WebSocket sends binary data in a specific format
        // This is a simplified parser - actual implementation depends on their spec
        const view = new DataView(buffer);

        try {
            // The actual parsing would depend on Angel One's binary format
            // This is a placeholder structure
            return {
                exchange: view.getUint8(0),
                token: view.getUint32(1).toString(),
                ltp: view.getFloat32(5) / 100,
                lastTradedQty: view.getUint32(9),
                avgTradedPrice: view.getFloat32(13) / 100,
                volume: view.getUint32(17),
                totalBuyQty: view.getUint32(21),
                totalSellQty: view.getUint32(25),
                open: view.getFloat32(29) / 100,
                high: view.getFloat32(33) / 100,
                low: view.getFloat32(37) / 100,
                close: view.getFloat32(41) / 100,
                oi: view.getUint32(45),
            };
        } catch {
            return null;
        }
    }

    private notifyTick(tick: WebSocketTick): void {
        for (const callback of this.tickCallbacks) {
            try {
                callback(tick);
            } catch (error) {
                console.error('Error in tick callback:', error);
            }
        }
    }

    private notifyConnectionChange(connected: boolean): void {
        for (const callback of this.connectionCallbacks) {
            try {
                callback(connected);
            } catch (error) {
                console.error('Error in connection callback:', error);
            }
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'heartbeat' }));
            }
        }, 30000); // 30 second heartbeat
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        setTimeout(() => {
            this.connect().catch(console.error);
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    private resubscribe(): void {
        for (const subscription of this.subscriptions.values()) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(subscription));
            }
        }
    }
}

// Singleton instance
export const angelOneWS = new AngelOneWebSocket();

// Export class for testing
export { AngelOneWebSocket };
