
import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { TimeScaleEngine } from "../../engine/core/TimeScaleEngine";
import { PriceScaleEngine } from "../../engine/core/PriceScaleEngine";
import { CoordinateMapper } from "../../engine/core/CoordinateMapper";
import { WebGLLayer } from "../../engine/layers/WebGLLayer";
import { CanvasLayer } from "../../engine/layers/CanvasLayer";
import { FootprintCandle } from "@/contexts/OrderFlowContext";

interface ChartCanvasProps {
    candles: FootprintCandle[];
    lastPrice: number;
    imbalanceRatio: number;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({ candles, lastPrice, imbalanceRatio }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
    const pixiAppRef = useRef<PIXI.Application | null>(null);

    // Core Engines Refs
    const timeScaleRef = useRef(new TimeScaleEngine());
    const priceScaleRef = useRef(new PriceScaleEngine());
    const mapperRef = useRef(new CoordinateMapper(timeScaleRef.current, priceScaleRef.current));

    // Layers
    const webGLRef = useRef<WebGLLayer | null>(null);
    const canvasLayerRef = useRef(new CanvasLayer());

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const scrollStartRef = useRef(0);

    // Initial Setup
    useEffect(() => {
        const initPixi = async () => {
            try {
                if (!containerRef.current || !canvasOverlayRef.current) return;

                // Prevent double init
                if (pixiAppRef.current) return;

                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                const app = new PIXI.Application();

                await app.init({
                    width,
                    height,
                    backgroundAlpha: 0,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                    resizeTo: containerRef.current
                });

                if (containerRef.current) {
                    containerRef.current.appendChild(app.canvas);
                    pixiAppRef.current = app;

                    // Init Layers after app is ready
                    webGLRef.current = new WebGLLayer(app);
                    canvasLayerRef.current.setContext(canvasOverlayRef.current.getContext("2d")!);

                    // Init Engine Dimensions
                    timeScaleRef.current.setDimensions(width);
                    priceScaleRef.current.setDimensions(height);

                    // Start Render Loop
                    app.ticker.add(() => {
                        try {
                            renderChart();
                        } catch (err) {
                            console.error("Render Error:", err);
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to initialize PixiJS:", error);
            }
        };

        if (!pixiAppRef.current) {
            initPixi();
        }

        return () => {
            if (pixiAppRef.current) {
                pixiAppRef.current.destroy(true, { children: true });
                pixiAppRef.current = null;
            }
        };
    }, []);

    // Handle Data Updates (moved outside renderChart to ensure refs are ready)
    useEffect(() => {
        if (candles.length > 0) {
            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);
            const max = Math.max(...highs, lastPrice + 5);
            const min = Math.min(...lows, lastPrice - 5);

            priceScaleRef.current.setRange(min, max);
        }
        // Only render if app is initialized
        if (pixiAppRef.current) {
            renderChart();
        }
    }, [candles, lastPrice, imbalanceRatio]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current || !pixiAppRef.current || !canvasOverlayRef.current) return;

            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;

            pixiAppRef.current.renderer.resize(w, h);
            canvasOverlayRef.current.width = w;
            canvasOverlayRef.current.height = h;

            timeScaleRef.current.setDimensions(w);
            priceScaleRef.current.setDimensions(h);

            renderChart();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderChart = () => {
        if (!webGLRef.current || !canvasLayerRef.current || !pixiAppRef.current) return;

        const data = { candles };
        const barWidth = timeScaleRef.current.getBarSpacing();
        const width = pixiAppRef.current.screen.width;
        const height = pixiAppRef.current.screen.height;

        // Render WebGL
        webGLRef.current.render(mapperRef.current, data, barWidth);

        // Render Canvas Overlay
        canvasLayerRef.current.render(mapperRef.current, data, barWidth, height, width);
    };

    // --- Interaction Handlers ---

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        scrollStartRef.current = timeScaleRef.current.getScrollOffset();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartRef.current.x;
        // Sensitivity: 1 pixel drag = how many bars?
        // Let's say drag left (negative dx) -> scroll right (positive offset) -> view OLDER bars
        // So dx negative -> increase scrollOffset

        const pixelsPerBar = timeScaleRef.current.getBarSpacing();
        const barsMoved = -dx / pixelsPerBar;

        timeScaleRef.current.setScrollOffset(scrollStartRef.current + barsMoved);
        renderChart();
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        if (e.ctrlKey) {
            // Zoom Price? Not implemented deep logic yet
        } else {
            // Zoom Time
            const zoomSpeed = 0.001;
            const delta = 1 - (e.deltaY * zoomSpeed);
            timeScaleRef.current.zoom(delta);
            renderChart();
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-[#0b0e11]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasOverlayRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
        </div>
    );
};

export default ChartCanvas;
