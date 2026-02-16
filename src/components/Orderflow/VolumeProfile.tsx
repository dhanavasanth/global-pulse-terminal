/**
 * VolumeProfile Component
 * Horizontal histogram showing volume distribution by price level
 */

import React, { useMemo } from 'react';
import type { VolumeLevelProfile } from '../../types/orderflow.types';

interface VolumeProfileProps {
    profile: VolumeLevelProfile[];
    height: number;
    width?: number;
}

const VolumeProfile: React.FC<VolumeProfileProps> = ({
    profile,
    height,
    width = 120
}) => {
    if (profile.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-muted-foreground text-xs"
                style={{ width, height }}
            >
                No data
            </div>
        );
    }

    const maxVolume = useMemo(() =>
        Math.max(...profile.map(l => l.totalVolume), 1),
        [profile]
    );

    const priceRange = useMemo(() => ({
        min: Math.min(...profile.map(l => l.price)),
        max: Math.max(...profile.map(l => l.price)),
    }), [profile]);

    const cellHeight = useMemo(() =>
        Math.max(12, height / profile.length),
        [height, profile.length]
    );

    return (
        <div
            className="relative bg-black/20 rounded overflow-hidden"
            style={{ width, height }}
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-secondary/30 border-b border-border/20 flex items-center px-2 text-[10px] text-muted-foreground z-10">
                <span>Volume Profile</span>
            </div>

            {/* Profile bars */}
            <div
                className="absolute left-0 right-0 overflow-y-auto"
                style={{ top: 24, bottom: 0 }}
            >
                {profile.map((level, index) => {
                    const bidPercent = (level.bidVolume / maxVolume) * 100;
                    const askPercent = (level.askVolume / maxVolume) * 100;

                    return (
                        <div
                            key={level.price}
                            className={`relative flex items-center h-3 ${level.isPOC ? 'bg-yellow-500/10' : ''} ${level.isValueArea ? 'bg-white/5' : ''}`}
                            style={{ minHeight: 12 }}
                        >
                            {/* Bid bar (left, red) */}
                            <div
                                className="absolute right-1/2 h-full bg-gradient-to-l from-red-500/60 to-red-500/20"
                                style={{ width: `${bidPercent / 2}%` }}
                            />

                            {/* Ask bar (right, green) */}
                            <div
                                className="absolute left-1/2 h-full bg-gradient-to-r from-green-500/60 to-green-500/20"
                                style={{ width: `${askPercent / 2}%` }}
                            />

                            {/* POC marker */}
                            {level.isPOC && (
                                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-yellow-500 transform -translate-x-1/2" />
                            )}

                            {/* Price label (on hover or POC) */}
                            {level.isPOC && (
                                <span className="absolute right-1 text-[9px] text-yellow-400 font-mono">
                                    {level.price.toFixed(2)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-secondary/30 border-t border-border/20 flex items-center justify-center gap-3 text-[9px]">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500/60 rounded-sm" />
                    Bid
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500/60 rounded-sm" />
                    Ask
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-sm" />
                    POC
                </span>
            </div>
        </div>
    );
};

export default VolumeProfile;
