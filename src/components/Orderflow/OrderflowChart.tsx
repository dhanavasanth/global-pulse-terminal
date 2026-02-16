/**
 * OrderflowChart Component
 * Main orchestrator for the footprint chart visualization
 * Connects data hook, canvas renderer, and volume profile
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import FootprintCanvas from './FootprintCanvas';
import VolumeProfile from './VolumeProfile';
import { useContextFootprintData } from '../../hooks/useContextFootprintData';
import { useOrderflowSettings } from '../../hooks/useOrderflowData';
import { useOrderFlow } from '../../contexts/OrderFlowContext';
import type { Timeframe } from '../../types/orderflow.types';
import { TIMEFRAME_CONFIG } from '../../types/orderflow.types';

interface OrderflowChartProps {
    symbol?: string;
    showVolumeProfile?: boolean;
    className?: string;
}

const OrderflowChart: React.FC<OrderflowChartProps> = ({
    symbol: propSymbol,
    showVolumeProfile = true,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // Fixed initial dimensions - will be updated on mount
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

    const { symbol, isConnected, setTimeframe, timeframe } = useOrderFlow();
    const displaySymbol = propSymbol || symbol;

    // Get footprint data from OrderFlowContext
    const { footprintBars, volumeProfile, currentBar, cumulativeDelta } = useContextFootprintData();

    const { settings, updateSettings } = useOrderflowSettings();

    // Handle resize - only update on actual window resize, not container growth
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) {
                    // Use parent's dimensions to avoid feedback loop
                    const rect = parent.getBoundingClientRect();
                    const headerHeight = 80; // Account for header and stats bar
                    setDimensions({
                        width: Math.max(400, rect.width - (showVolumeProfile ? 130 : 10)),
                        height: Math.max(300, rect.height - headerHeight),
                    });
                }
            }
        };

        // Initial update with a small delay to ensure parent is rendered
        const timeoutId = setTimeout(updateDimensions, 100);

        // Only listen to window resize, not container resize
        window.addEventListener('resize', updateDimensions);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateDimensions);
        };
    }, [showVolumeProfile]);

    const handleTimeframeChange = useCallback((tf: string) => {
        setTimeframe(tf);
        updateSettings({ timeframe: tf as Timeframe });
    }, [setTimeframe, updateSettings]);

    return (
        <div
            ref={containerRef}
            className={`flex flex-col h-full max-h-full bg-[#0b0e11] rounded-lg overflow-hidden ${className}`}
            style={{ minHeight: '400px', maxHeight: '100%' }}
        >
            {/* Header Controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{displaySymbol}</span>
                    <span className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center gap-1">
                    {(Object.keys(TIMEFRAME_CONFIG) as Timeframe[]).slice(0, 6).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => handleTimeframeChange(tf)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${timeframe === tf
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>

                {/* Display Mode Toggle */}
                <div className="flex items-center gap-1">
                    {(['split', 'delta', 'imbalance'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => updateSettings({ displayMode: mode })}
                            className={`px-2 py-1 text-xs font-medium rounded capitalize transition-all ${settings.displayMode === mode
                                    ? 'bg-primary/20 text-primary border border-primary/50'
                                    : 'text-muted-foreground hover:bg-secondary'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 px-3 py-1.5 bg-black/20 border-b border-border/20 text-xs flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Bars:</span>
                    <span className="font-mono text-foreground">{footprintBars.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Cum. Δ:</span>
                    <span className={`font-mono font-semibold ${(cumulativeDelta[0] || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {(cumulativeDelta[0] || 0) >= 0 ? '+' : ''}{(cumulativeDelta[0] || 0).toFixed(0)}
                    </span>
                </div>
                {currentBar && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Current Δ:</span>
                        <span className={`font-mono ${currentBar.totalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {currentBar.totalDelta >= 0 ? '+' : ''}{currentBar.totalDelta.toFixed(0)}
                        </span>
                    </div>
                )}
                {settings.showPOC && currentBar && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">POC:</span>
                        <span className="font-mono text-yellow-400">{currentBar.poc.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Main Chart Area - flex-1 with overflow hidden to prevent growth */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Footprint Canvas */}
                <div className="flex-1 relative overflow-hidden">
                    <FootprintCanvas
                        bars={footprintBars}
                        currentBar={currentBar}
                        settings={settings}
                        width={dimensions.width}
                        height={dimensions.height}
                    />

                    {/* Empty state */}
                    {footprintBars.length === 0 && !currentBar && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <div className="text-lg font-semibold mb-2">Waiting for trades...</div>
                                <div className="text-sm">Footprint data will appear as trades execute</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Volume Profile Sidebar */}
                {showVolumeProfile && (
                    <div className="w-[120px] border-l border-border/20 flex-shrink-0 overflow-hidden">
                        <VolumeProfile
                            profile={volumeProfile}
                            height={dimensions.height}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderflowChart;
