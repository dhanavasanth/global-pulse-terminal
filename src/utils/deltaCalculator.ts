/**
 * Delta Calculator Utilities
 * Core calculation logic for footprint chart data
 */

import type {
    Trade,
    FootprintBar,
    FootprintCell,
    VolumeLevelProfile,
    Timeframe,
    TIMEFRAME_CONFIG
} from '../types/orderflow.types';

/**
 * Calculate delta for a group of trades at a single price level
 */
export function calculateCellDelta(trades: Trade[], price: number): FootprintCell {
    let bidVolume = 0;
    let askVolume = 0;
    let tradeCount = 0;

    trades.forEach(trade => {
        if (Math.abs(trade.price - price) < 0.01) { // Price tolerance
            if (trade.side === 'buy') {
                askVolume += trade.size; // Buyer aggressor hits asks
            } else {
                bidVolume += trade.size; // Seller aggressor hits bids
            }
            tradeCount++;
        }
    });

    const delta = askVolume - bidVolume;
    const totalVolume = bidVolume + askVolume;
    const deltaPercent = totalVolume > 0 ? (delta / totalVolume) * 100 : 0;

    return {
        price,
        bidVolume,
        askVolume,
        delta,
        deltaPercent,
        totalVolume,
        tradeCount,
        isPOC: false, // Set later
    };
}

/**
 * Aggregate trades into a footprint bar for a time period
 */
export function aggregateToFootprintBar(
    trades: Trade[],
    startTime: number,
    endTime: number,
    tickSize: number = 0.5
): FootprintBar | null {
    if (trades.length === 0) return null;

    // Find price range
    const prices = trades.map(t => t.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const open = trades[0].price;
    const close = trades[trades.length - 1].price;

    // Generate price levels
    const priceLevels: number[] = [];
    const roundedLow = Math.floor(low / tickSize) * tickSize;
    const roundedHigh = Math.ceil(high / tickSize) * tickSize;

    for (let p = roundedLow; p <= roundedHigh; p += tickSize) {
        priceLevels.push(Math.round(p * 100) / 100);
    }

    // Calculate cells for each price level
    const cells: FootprintCell[] = priceLevels.map(price => {
        const levelTrades = trades.filter(t => {
            const roundedPrice = Math.round(t.price / tickSize) * tickSize;
            return Math.abs(roundedPrice - price) < tickSize / 2;
        });
        return calculateCellFromTrades(levelTrades, price);
    });

    // Calculate totals
    let totalBidVolume = 0;
    let totalAskVolume = 0;
    let maxVolume = 0;
    let pocPrice = cells[0]?.price || 0;

    cells.forEach(cell => {
        totalBidVolume += cell.bidVolume;
        totalAskVolume += cell.askVolume;
        if (cell.totalVolume > maxVolume) {
            maxVolume = cell.totalVolume;
            pocPrice = cell.price;
        }
    });

    // Mark POC
    cells.forEach(cell => {
        cell.isPOC = cell.price === pocPrice && cell.totalVolume > 0;
    });

    const totalDelta = totalAskVolume - totalBidVolume;
    const totalVolume = totalBidVolume + totalAskVolume;

    return {
        timestamp: startTime,
        openTime: startTime,
        closeTime: endTime,
        open,
        high,
        low,
        close,
        cells,
        totalBidVolume,
        totalAskVolume,
        totalDelta,
        totalVolume,
        poc: pocPrice,
    };
}

/**
 * Calculate cell data from trades at a specific price level
 */
function calculateCellFromTrades(trades: Trade[], price: number): FootprintCell {
    let bidVolume = 0;
    let askVolume = 0;

    trades.forEach(trade => {
        if (trade.side === 'buy') {
            askVolume += trade.size;
        } else {
            bidVolume += trade.size;
        }
    });

    const delta = askVolume - bidVolume;
    const totalVolume = bidVolume + askVolume;
    const deltaPercent = totalVolume > 0 ? (delta / totalVolume) * 100 : 0;

    return {
        price,
        bidVolume: Math.round(bidVolume * 10000) / 10000,
        askVolume: Math.round(askVolume * 10000) / 10000,
        delta: Math.round(delta * 10000) / 10000,
        deltaPercent,
        totalVolume: Math.round(totalVolume * 10000) / 10000,
        tradeCount: trades.length,
        isPOC: false,
    };
}

/**
 * Calculate cumulative delta from a series of bars
 */
export function calculateCumulativeDelta(bars: FootprintBar[]): number[] {
    let cumulative = 0;
    return bars.map(bar => {
        cumulative += bar.totalDelta;
        return cumulative;
    });
}

/**
 * Find Point of Control (price with highest volume) in a bar
 */
export function findPOC(bar: FootprintBar): number {
    if (bar.cells.length === 0) return bar.close;

    let maxVolume = 0;
    let pocPrice = bar.cells[0].price;

    bar.cells.forEach(cell => {
        if (cell.totalVolume > maxVolume) {
            maxVolume = cell.totalVolume;
            pocPrice = cell.price;
        }
    });

    return pocPrice;
}

/**
 * Calculate volume profile from multiple bars
 */
export function calculateVolumeProfile(
    bars: FootprintBar[],
    tickSize: number = 0.5
): VolumeLevelProfile[] {
    // Aggregate all cells by price
    const priceMap = new Map<number, { bidVolume: number; askVolume: number }>();

    bars.forEach(bar => {
        bar.cells.forEach(cell => {
            const roundedPrice = Math.round(cell.price / tickSize) * tickSize;
            const existing = priceMap.get(roundedPrice) || { bidVolume: 0, askVolume: 0 };
            priceMap.set(roundedPrice, {
                bidVolume: existing.bidVolume + cell.bidVolume,
                askVolume: existing.askVolume + cell.askVolume,
            });
        });
    });

    // Convert to array and calculate totals
    const levels: VolumeLevelProfile[] = [];
    let grandTotal = 0;
    let maxVolume = 0;
    let pocPrice = 0;

    priceMap.forEach((data, price) => {
        const totalVolume = data.bidVolume + data.askVolume;
        grandTotal += totalVolume;
        if (totalVolume > maxVolume) {
            maxVolume = totalVolume;
            pocPrice = price;
        }
        levels.push({
            price,
            bidVolume: data.bidVolume,
            askVolume: data.askVolume,
            totalVolume,
            percentage: 0, // Calculated below
            isPOC: false,
            isValueArea: false,
        });
    });

    // Calculate percentages and find POC
    levels.forEach(level => {
        level.percentage = grandTotal > 0 ? (level.totalVolume / grandTotal) * 100 : 0;
        level.isPOC = level.price === pocPrice;
    });

    // Calculate Value Area (70% of volume)
    const sortedByVolume = [...levels].sort((a, b) => b.totalVolume - a.totalVolume);
    let valueAreaVolume = 0;
    const valueAreaTarget = grandTotal * 0.7;

    sortedByVolume.forEach(level => {
        if (valueAreaVolume < valueAreaTarget) {
            level.isValueArea = true;
            valueAreaVolume += level.totalVolume;
        }
    });

    // Sort by price for display
    return levels.sort((a, b) => b.price - a.price);
}

/**
 * Get color for delta value based on intensity
 */
export function getDeltaColor(
    delta: number,
    totalVolume: number,
    scheme: 'default' | 'heatmap' | 'monochrome' = 'default'
): string {
    if (totalVolume === 0) return '#424242';

    const defaultScheme = {
        strongBuy: '#00C853',
        moderateBuy: '#69F0AE',
        neutral: '#424242',
        moderateSell: '#FF5252',
        strongSell: '#D32F2F',
    };

    const deltaPercent = Math.abs(delta / totalVolume);
    const intensity = Math.min(deltaPercent * 2, 1.0);

    if (delta > 0) {
        // Buying pressure - green
        return interpolateColor(defaultScheme.moderateBuy, defaultScheme.strongBuy, intensity);
    } else if (delta < 0) {
        // Selling pressure - red
        return interpolateColor(defaultScheme.moderateSell, defaultScheme.strongSell, intensity);
    }

    return defaultScheme.neutral;
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

/**
 * Format volume for display (abbreviate large numbers)
 */
export function formatVolume(volume: number): string {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + 'M';
    }
    if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + 'K';
    }
    if (volume >= 1) {
        return volume.toFixed(2);
    }
    return volume.toFixed(4);
}

/**
 * Format delta with sign
 */
export function formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return sign + formatVolume(delta);
}
