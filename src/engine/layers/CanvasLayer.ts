
import { CoordinateMapper } from "../core/CoordinateMapper";
import { ChartData } from "../core/ChartData";

export class CanvasLayer {
    private _ctx: CanvasRenderingContext2D | null = null;

    constructor() { }

    public setContext(ctx: CanvasRenderingContext2D) {
        this._ctx = ctx;
    }

    public render(mapper: CoordinateMapper, data: ChartData, barWidth: number, height: number, width: number) {
        if (!this._ctx) return;
        const ctx = this._ctx;

        // Clear
        ctx.clearRect(0, 0, width, height);

        ctx.textBaseline = "middle";

        // 1. Grid Lines (Horizontal)
        // We need visible price range from data or scale?
        // CanvasLayer doesn't have direct access to PriceScale, but we can infer or pass it.
        // For now, let's use the candle levels to determine prominent grid lines if possible, or just simple loop relative to height.
        // Better: Use mapper to find Y for fixed price intervals.
        // Let's assume tickSize is attached to data or we iterate visible range.

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;

        // Draw simple horizontal lines every 50 pixels approx?
        // Or better: Use the candles to find common price steps.
        // Let's just draw lines at the Price Levels of the first visible candle for now (simple grid)
        if (data.candles.length > 0) {
            const firstCandle = data.candles[data.candles.length - 1]; // Closest to right
            if (firstCandle.levels) {
                ctx.beginPath();
                firstCandle.levels.forEach((level, idx) => {
                    // Draw every 5th level to avoid clutter unless zoomed in?
                    if (idx % 5 === 0) {
                        const y = mapper.toPixel(0, level.price).y;
                        ctx.moveTo(0, y);
                        ctx.lineTo(width, y);
                    }
                });
                ctx.stroke();
            }
        }

        const candles = data.candles;

        // Define spacing
        const spineWidth = 6;
        const spacing = 4; // Gap between text and spine

        candles.forEach((candle, i) => {
            const visualIndex = (candles.length - 1) - i;
            const xCenter = mapper.toPixel(visualIndex, 0).x;

            if (xCenter < -barWidth || xCenter > width + barWidth) return;

            // Header Stats (Top of Bar)
            // Reference image shows stacks of numbers at top/bottom.
            // Let's place standard stats at top: Vol, Delta
            const topY = mapper.toPixel(0, candle.high).y - 25;

            ctx.font = "10px monospace";
            ctx.fillStyle = "#888";
            ctx.textAlign = "center";

            // Clean format
            ctx.fillText(`V:${candle.volume}`, xCenter, topY);
            ctx.fillStyle = candle.delta > 0 ? "#26a69a" : "#ef5350";
            ctx.fillText(`Δ:${candle.delta}`, xCenter, topY + 12);
            // ctx.fillText(`CD:${candle.cumDelta}`, xCenter, topY + 24);

            // Footprint Numbers
            if (candle.levels && barWidth > 40) {
                candle.levels.forEach(level => {
                    const y = mapper.toPixel(0, level.price).y;

                    if (y < -20 || y > height + 20) return;

                    // Bid (Left)
                    ctx.textAlign = "end";
                    ctx.fillStyle = level.imbalances.bid ? "#ef5350" : "#b0bec5"; // Bright red or soft white/gray
                    if (level.imbalances.bid) ctx.font = "bold 10px monospace";
                    else ctx.font = "10px monospace";

                    // xCenter - spine/2 - spacing
                    ctx.fillText(level.bidVol.toString(), xCenter - spineWidth / 2 - spacing, y);

                    // Ask (Right)
                    ctx.textAlign = "start";
                    ctx.fillStyle = level.imbalances.ask ? "#26a69a" : "#b0bec5"; // Bright green or soft white/gray
                    if (level.imbalances.ask) ctx.font = "bold 10px monospace";
                    else ctx.font = "10px monospace";

                    // xCenter + spine/2 + spacing
                    ctx.fillText(level.askVol.toString(), xCenter + spineWidth / 2 + spacing, y);
                });
            }

            // Time Axis
            ctx.textAlign = "center";
            ctx.fillStyle = "#555";
            ctx.font = "10px sans-serif";
            ctx.fillText(new Date(candle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), xCenter, height - 10);
        });
    }
}
