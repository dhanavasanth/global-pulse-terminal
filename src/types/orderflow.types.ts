/**
 * Orderflow Chart Type Definitions
 * Based on PRD v1.0 - Professional Footprint Chart Component
 */

// ============================================================
// Core Trade Data
// ============================================================

export interface Trade {
    id: string;
    symbol: string;
    timestamp: number; // Unix timestamp ms
    price: number;
    size: number;
    side: 'buy' | 'sell'; // Aggressor side
    exchange?: string;
}

// ============================================================
// Footprint Data Structures
// ============================================================

/**
 * Single footprint cell at a specific price level within a bar
 */
export interface FootprintCell {
    price: number;
    bidVolume: number;  // Sell-side aggressor volume
    askVolume: number;  // Buy-side aggressor volume
    delta: number;      // askVolume - bidVolume
    deltaPercent: number;
    totalVolume: number;
    tradeCount: number;
    isPOC: boolean;     // Point of Control for this bar
}

/**
 * Complete footprint bar for a single time period
 */
export interface FootprintBar {
    timestamp: number;
    openTime: number;
    closeTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    cells: FootprintCell[];
    totalBidVolume: number;
    totalAskVolume: number;
    totalDelta: number;
    totalVolume: number;
    poc: number;  // Price level with highest volume
}

/**
 * Volume profile level for the sidebar histogram
 */
export interface VolumeLevelProfile {
    price: number;
    bidVolume: number;
    askVolume: number;
    totalVolume: number;
    percentage: number;  // % of total volume
    isPOC: boolean;
    isValueArea: boolean; // Within 70% volume zone
}

// ============================================================
// Configuration
// ============================================================

export type Timeframe = '1s' | '5s' | '15s' | '30s' | '1m' | '5m' | '15m';
export type DisplayMode = 'split' | 'delta' | 'imbalance';
export type ColorScheme = 'default' | 'heatmap' | 'monochrome';

export interface OrderflowSettings {
    timeframe: Timeframe;
    displayMode: DisplayMode;
    colorScheme: ColorScheme;
    showPOC: boolean;
    showVolumeProfile: boolean;
    showCumulativeDelta: boolean;
    priceDecimals: number;
    volumeThreshold: number;    // Minimum volume to display
    cellHeight: number;         // Pixels per price level
    maxBars: number;            // Visible history
    imbalanceThreshold: number; // % threshold for imbalance highlighting
}

export const DEFAULT_ORDERFLOW_SETTINGS: OrderflowSettings = {
    timeframe: '5s',
    displayMode: 'split',
    colorScheme: 'default',
    showPOC: true,
    showVolumeProfile: true,
    showCumulativeDelta: true,
    priceDecimals: 2,
    volumeThreshold: 0,
    cellHeight: 20,
    maxBars: 100,
    imbalanceThreshold: 300, // 300% imbalance (3:1 ratio)
};

// ============================================================
// Color Schemes
// ============================================================

export const COLOR_SCHEMES = {
    default: {
        strongBuy: '#00C853',     // Dark Green
        moderateBuy: '#69F0AE',   // Light Green
        neutral: '#424242',       // Dark Gray
        moderateSell: '#FF5252',  // Light Red
        strongSell: '#D32F2F',    // Dark Red
        poc: '#FFD700',           // Gold
        valueArea: 'rgba(255, 193, 7, 0.2)', // Amber transparent
    },
    heatmap: {
        low: '#1A237E',           // Dark Blue
        medium: '#FFC107',        // Amber
        high: '#FF5722',          // Deep Orange
    },
    monochrome: {
        strongBuy: '#FFFFFF',
        moderateBuy: '#BDBDBD',
        neutral: '#616161',
        moderateSell: '#757575',
        strongSell: '#424242',
    },
} as const;

// ============================================================
// Aggregation Helpers  
// ============================================================

export interface TimeframeConfig {
    label: string;
    milliseconds: number;
}

export const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
    '1s': { label: '1 Second', milliseconds: 1000 },
    '5s': { label: '5 Seconds', milliseconds: 5000 },
    '15s': { label: '15 Seconds', milliseconds: 15000 },
    '30s': { label: '30 Seconds', milliseconds: 30000 },
    '1m': { label: '1 Minute', milliseconds: 60000 },
    '5m': { label: '5 Minutes', milliseconds: 300000 },
    '15m': { label: '15 Minutes', milliseconds: 900000 },
};

// ============================================================
// Component Props
// ============================================================

export interface OrderflowChartProps {
    symbol: string;
    settings?: Partial<OrderflowSettings>;
    onCellClick?: (cell: FootprintCell, bar: FootprintBar) => void;
    className?: string;
}

export interface FootprintCanvasProps {
    bars: FootprintBar[];
    settings: OrderflowSettings;
    width: number;
    height: number;
    onCellHover?: (cell: FootprintCell | null, bar: FootprintBar | null) => void;
}

export interface VolumeProfileProps {
    profile: VolumeLevelProfile[];
    height: number;
    width?: number;
}
