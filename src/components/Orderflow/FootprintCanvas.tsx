/**
 * FootprintCanvas Component
 * Canvas-based rendering of footprint cells with delta visualization
 * Integrates with existing PixiJS chart infrastructure
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { FootprintBar, FootprintCell, OrderflowSettings } from '../../types/orderflow.types';
import { getDeltaColor, formatVolume, formatDelta } from '../../utils/deltaCalculator';

interface FootprintCanvasProps {
    bars: FootprintBar[];
    currentBar: FootprintBar | null;
    settings: OrderflowSettings;
    width: number;
    height: number;
    onCellHover?: (cell: FootprintCell | null, bar: FootprintBar | null) => void;
}

const CELL_PADDING = 2;
const MIN_CELL_HEIGHT = 16;
const BAR_GAP = 4;

const FootprintCanvas: React.FC<FootprintCanvasProps> = ({
    bars,
    currentBar,
    settings,
    width,
    height,
    onCellHover,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    // Combine historical bars with current incomplete bar
    const allBars = useMemo(() => {
        const result = [...bars];
        if (currentBar) {
            result.unshift(currentBar);
        }
        return result.slice(0, settings.maxBars);
    }, [bars, currentBar, settings.maxBars]);

    // Calculate price range from all bars
    const priceRange = useMemo(() => {
        if (allBars.length === 0) return { min: 0, max: 0 };

        let min = Infinity;
        let max = -Infinity;

        allBars.forEach(bar => {
            bar.cells.forEach(cell => {
                if (cell.price < min) min = cell.price;
                if (cell.price > max) max = cell.price;
            });
        });

        // Add padding
        const padding = (max - min) * 0.05 || 10;
        return { min: min - padding, max: max + padding };
    }, [allBars]);

    // Calculate bar width based on available space
    const barWidth = useMemo(() => {
        if (allBars.length === 0) return 80;
        return Math.max(60, (width - 60) / Math.min(allBars.length, 10));
    }, [width, allBars.length]);

    // Map price to Y coordinate
    const priceToY = useCallback((price: number): number => {
        const { min, max } = priceRange;
        if (max === min) return height / 2;
        return height - ((price - min) / (max - min)) * height;
    }, [priceRange, height]);

    // Render a single footprint cell
    const renderCell = useCallback((
        ctx: CanvasRenderingContext2D,
        cell: FootprintCell,
        x: number,
        y: number,
        cellWidth: number,
        cellHeight: number
    ) => {
        const bgColor = getDeltaColor(cell.delta, cell.totalVolume, settings.colorScheme);

        // Background with delta color
        ctx.fillStyle = bgColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.globalAlpha = 1;

        // POC marker
        if (cell.isPOC && settings.showPOC) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        }

        // Skip text if cell too small
        if (cellHeight < MIN_CELL_HEIGHT) return;

        const fontSize = Math.min(10, cellHeight - 4);
        ctx.font = `bold ${fontSize}px 'JetBrains Mono', monospace`;

        const textY = y + cellHeight / 2 + fontSize / 3;

        if (settings.displayMode === 'split') {
            // Bid volume (left, red)
            if (cell.bidVolume > settings.volumeThreshold) {
                ctx.fillStyle = '#FF5252';
                ctx.textAlign = 'left';
                ctx.fillText(formatVolume(cell.bidVolume), x + CELL_PADDING, textY);
            }

            // Ask volume (right, green)
            if (cell.askVolume > settings.volumeThreshold) {
                ctx.fillStyle = '#00C853';
                ctx.textAlign = 'right';
                ctx.fillText(formatVolume(cell.askVolume), x + cellWidth - CELL_PADDING, textY);
            }
        } else if (settings.displayMode === 'delta') {
            // Delta only (center)
            ctx.fillStyle = cell.delta >= 0 ? '#00C853' : '#FF5252';
            ctx.textAlign = 'center';
            ctx.fillText(formatDelta(cell.delta), x + cellWidth / 2, textY);
        } else {
            // Imbalance percentage
            const imbalance = cell.totalVolume > 0
                ? Math.round(Math.abs(cell.delta / cell.totalVolume) * 100)
                : 0;
            ctx.fillStyle = cell.delta >= 0 ? '#00C853' : '#FF5252';
            ctx.textAlign = 'center';
            ctx.fillText(`${imbalance}%`, x + cellWidth / 2, textY);
        }
    }, [settings]);

    // Render a complete footprint bar
    const renderBar = useCallback((
        ctx: CanvasRenderingContext2D,
        bar: FootprintBar,
        barIndex: number
    ) => {
        if (bar.cells.length === 0) return;

        const x = width - (barIndex + 1) * (barWidth + BAR_GAP) - 60; // Right-to-left, leave space for price axis

        if (x < 0) return; // Off screen

        // Calculate cell height based on number of levels
        const cellHeight = Math.max(
            MIN_CELL_HEIGHT,
            Math.min(settings.cellHeight, height / Math.max(bar.cells.length, 10))
        );

        // Render each cell
        bar.cells.forEach(cell => {
            const y = priceToY(cell.price);
            renderCell(ctx, cell, x, y - cellHeight / 2, barWidth, cellHeight);
        });

        // Bar timestamp label
        const time = new Date(bar.timestamp);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        ctx.fillStyle = '#9E9E9E';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x + barWidth / 2, height - 4);

        // Cumulative delta at top
        if (settings.showCumulativeDelta) {
            ctx.fillStyle = bar.totalDelta >= 0 ? '#00C853' : '#FF5252';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(formatDelta(bar.totalDelta), x + barWidth / 2, 12);
        }
    }, [width, barWidth, height, priceToY, renderCell, settings]);

    // Main render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#0b0e11';
        ctx.fillRect(0, 0, width, height);

        // Price axis (right side)
        renderPriceAxis(ctx, priceRange, height, width);

        // Render bars (newest first, right to left)
        allBars.forEach((bar, index) => {
            renderBar(ctx, bar, index);
        });

        // Grid lines
        renderGrid(ctx, priceRange, width, height, priceToY);

    }, [width, height, allBars, priceRange, renderBar, priceToY]);

    // Animation loop
    useEffect(() => {
        const animate = () => {
            render();
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [render]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;
    }, [width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full"
            style={{ imageRendering: 'pixelated' }}
        />
    );
};

// Helper: Render price axis
function renderPriceAxis(
    ctx: CanvasRenderingContext2D,
    priceRange: { min: number; max: number },
    height: number,
    width: number
) {
    const axisWidth = 55;
    const x = width - axisWidth;

    // Axis background
    ctx.fillStyle = '#1a1d21';
    ctx.fillRect(x, 0, axisWidth, height);

    // Axis line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Price labels
    const { min, max } = priceRange;
    const range = max - min;
    if (range <= 0) return;

    const step = calculateNiceStep(range, 8);
    const startPrice = Math.ceil(min / step) * step;

    ctx.fillStyle = '#9E9E9E';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    for (let price = startPrice; price <= max; price += step) {
        const y = height - ((price - min) / range) * height;
        if (y > 10 && y < height - 10) {
            ctx.fillText(price.toFixed(2), width - 5, y + 3);

            // Tick mark
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 4, y);
            ctx.stroke();
        }
    }
}

// Helper: Render grid lines
function renderGrid(
    ctx: CanvasRenderingContext2D,
    priceRange: { min: number; max: number },
    width: number,
    height: number,
    priceToY: (price: number) => number
) {
    const { min, max } = priceRange;
    const range = max - min;
    if (range <= 0) return;

    const step = calculateNiceStep(range, 8);
    const startPrice = Math.ceil(min / step) * step;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let price = startPrice; price <= max; price += step) {
        const y = priceToY(price);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 55, y);
        ctx.stroke();
    }
}

// Helper: Calculate nice step for axis labels
function calculateNiceStep(range: number, targetSteps: number): number {
    const roughStep = range / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let niceNormalized = 1;
    if (normalized < 1.5) niceNormalized = 1;
    else if (normalized < 3) niceNormalized = 2;
    else if (normalized < 7) niceNormalized = 5;
    else niceNormalized = 10;

    return niceNormalized * magnitude;
}

export default FootprintCanvas;
