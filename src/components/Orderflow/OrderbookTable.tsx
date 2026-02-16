/**
 * Orderbook Table Component
 * Real-time L2 orderbook visualization with depth bars
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { useOrderflowStore, selectBids, selectAsks, selectMidPrice, selectIsConnected } from '../../store/orderflowStore';
import { wsService } from '../../services/websocket';

interface OrderbookRowProps {
    price: number;
    size: number;
    total: number;
    maxTotal: number;
    type: 'bid' | 'ask';
}

const OrderbookRow: React.FC<OrderbookRowProps> = React.memo(({
    price,
    size,
    total,
    maxTotal,
    type
}) => {
    const depthPercent = (total / maxTotal) * 100;
    const isBid = type === 'bid';

    return (
        <div className="relative grid grid-cols-3 gap-1 hover:bg-white/10 transition-colors">
            {/* Depth bar background */}
            <div
                className={`absolute inset-y-0 ${isBid ? 'left-0' : 'right-0'} transition-all duration-150`}
                style={{
                    width: `${depthPercent}%`,
                    background: isBid
                        ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)'
                        : 'linear-gradient(270deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)'
                }}
            />

            {/* Content */}
            {isBid ? (
                <>
                    <div className="relative z-10 text-left pl-2 font-medium text-green-400">
                        {size.toFixed(4)}
                    </div>
                    <div className="relative z-10 text-center font-semibold text-green-400">
                        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="relative z-10" />
                </>
            ) : (
                <>
                    <div className="relative z-10" />
                    <div className="relative z-10 text-center font-semibold text-red-400">
                        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="relative z-10 text-right pr-2 font-medium text-red-400">
                        {size.toFixed(4)}
                    </div>
                </>
            )}
        </div>
    );
});

OrderbookRow.displayName = 'OrderbookRow';

const OrderbookTable: React.FC = () => {
    const symbol = useOrderflowStore((state) => state.symbol);
    const bids = useOrderflowStore(selectBids);
    const asks = useOrderflowStore(selectAsks);
    const midPrice = useOrderflowStore(selectMidPrice);
    const isConnected = useOrderflowStore(selectIsConnected);
    const spread = useOrderflowStore((state) => state.spread);

    // Connect on mount, cleanup on unmount
    useEffect(() => {
        wsService.connect(symbol);
        return () => {
            wsService.disconnect();
        };
    }, [symbol]);

    // Calculate max totals for depth visualization
    const { maxBidTotal, maxAskTotal } = useMemo(() => ({
        maxBidTotal: bids.length > 0 ? Math.max(...bids.map(b => b.total || 0), 1) : 1,
        maxAskTotal: asks.length > 0 ? Math.max(...asks.map(a => a.total || 0), 1) : 1,
    }), [bids, asks]);

    const spreadPercent = useMemo(() => {
        if (!midPrice || !spread) return '0.00';
        return ((spread / midPrice) * 100).toFixed(3);
    }, [midPrice, spread]);

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-black/30 to-black/20 rounded-lg overflow-hidden font-mono text-[11px]">
            {/* Header */}
            <div className="px-3 py-2 bg-secondary/50 border-b border-border/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{symbol}</span>
                    <span className="text-muted-foreground text-[10px]">Orderbook</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-colors ${isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'
                        }`} />
                    <span className="text-[10px] text-muted-foreground">
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-1 px-2 py-1.5 text-center text-[10px] text-muted-foreground uppercase tracking-wider border-b border-white/5">
                <div>Bid Size</div>
                <div>Price</div>
                <div>Ask Size</div>
            </div>

            {/* Orderbook Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Asks (reversed to show highest at top) */}
                <div className="flex flex-col-reverse">
                    {asks.map((ask, i) => (
                        <OrderbookRow
                            key={`ask-${ask.price}-${i}`}
                            price={ask.price}
                            size={ask.size}
                            total={ask.total || 0}
                            maxTotal={maxAskTotal}
                            type="ask"
                        />
                    ))}
                </div>

                {/* Spread Indicator */}
                <div className="border-y border-primary/30 py-2 px-3 bg-primary/5 flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">
                        {midPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="text-right">
                        <span className="text-muted-foreground text-[10px]">Spread: </span>
                        <span className="text-foreground font-medium">${spread.toFixed(2)}</span>
                        <span className="text-muted-foreground text-[10px] ml-1">({spreadPercent}%)</span>
                    </div>
                </div>

                {/* Bids */}
                <div className="flex flex-col">
                    {bids.map((bid, i) => (
                        <OrderbookRow
                            key={`bid-${bid.price}-${i}`}
                            price={bid.price}
                            size={bid.size}
                            total={bid.total || 0}
                            maxTotal={maxBidTotal}
                            type="bid"
                        />
                    ))}
                </div>
            </div>

            {/* Footer Stats */}
            <div className="px-3 py-1.5 bg-secondary/30 border-t border-border/30 flex justify-between text-[10px] text-muted-foreground">
                <span>{bids.length} bids</span>
                <span>{asks.length} asks</span>
            </div>
        </div>
    );
};

export default OrderbookTable;
