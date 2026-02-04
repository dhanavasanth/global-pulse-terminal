
import * as PIXI from "pixi.js";
import { CoordinateMapper } from "../core/CoordinateMapper";
import { ChartData } from "../core/ChartData";

export class WebGLLayer {
    private _app: PIXI.Application;
    private _candleContainer: PIXI.Container;
    private _footprintContainer: PIXI.Container;

    constructor(app: PIXI.Application) {
        this._app = app;
        this._candleContainer = new PIXI.Container();
        this._footprintContainer = new PIXI.Container();

        this._app.stage.addChild(this._footprintContainer); // Background
        this._app.stage.addChild(this._candleContainer); // Foreground (candles)
    }

    public render(mapper: CoordinateMapper, data: ChartData, barWidth: number) {
        // Clear previous
        this._candleContainer.removeChildren();
        this._footprintContainer.removeChildren();

        const candles = data.candles;
        const gCandles = new PIXI.Graphics(); // Candle Body / Spine
        const gImbalance = new PIXI.Graphics(); // Backgrounds for imbalances/POC

        this._candleContainer.addChild(gCandles);
        this._footprintContainer.addChild(gImbalance);

        const ROW_HEIGHT = 20; // Hardcoded row height for now, should come from PriceEngine ideally or be dynamic
        // In this architecture, PriceScale determines Y. We assume constant tick spacing approx 20px if zoomed in.
        // Actually, we should calculate height based on 1 tick diff.

        // Let's get pixel height of 1 tick from mapper (using mock price diff)
        // We assume ChartData has tickSize info or we calculate it. 
        // For visual consistency, let's derive it or pass it. 
        // For now, allow slight mismatch or calculate on fly.

        candles.forEach((candle, i) => {
            const visualIndex = (candles.length - 1) - i;
            const xCenter = mapper.toPixel(visualIndex, 0).x;

            // Safety check for coordinates
            if (!Number.isFinite(xCenter)) return;

            const openY = mapper.toPixel(0, candle.open).y;
            const closeY = mapper.toPixel(0, candle.close).y;
            const highY = mapper.toPixel(0, candle.high).y;
            const lowY = mapper.toPixel(0, candle.low).y;

            if (!Number.isFinite(openY) || !Number.isFinite(highY)) return;

            const isBullish = candle.close >= candle.open;
            const candleColor = isBullish ? 0x26a69a : 0xef5350;

            // 1. Candle Spine
            gCandles.moveTo(xCenter, highY);
            gCandles.lineTo(xCenter, lowY);
            gCandles.stroke({ width: 2, color: candleColor, alpha: 0.8 });

            // 2. Open/Close Markers
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(openY - closeY));

            gCandles.rect(xCenter - 3, bodyTop, 6, bodyHeight);
            gCandles.fill({ color: candleColor });

            // 3. Footprint Levels (Imbalances & POC)
            if (candle.levels && barWidth > 40) {
                const cellHeight = 18; // Fixed visual height

                candle.levels.forEach(level => {
                    const y = mapper.toPixel(0, level.price).y;
                    if (!Number.isFinite(y)) return;

                    // Imbalances
                    const ratio = level.askVol / (Math.max(1, level.bidVol));
                    const invRatio = level.bidVol / (Math.max(1, level.askVol));

                    const isAskImbalance = ratio >= 3 && level.bidVol > 0 && level.askVol > 0;
                    const isBidImbalance = invRatio >= 3 && level.askVol > 0 && level.bidVol > 0;

                    const halfWidth = (barWidth * 0.9) / 2;

                    if (isBidImbalance) {
                        gImbalance.rect(xCenter - halfWidth - 2, y - cellHeight / 2, halfWidth, cellHeight);
                        gImbalance.fill({ color: 0xff5252, alpha: 0.4 });
                    }

                    if (isAskImbalance) {
                        gImbalance.rect(xCenter + 2, y - cellHeight / 2, halfWidth, cellHeight);
                        gImbalance.fill({ color: 0x00e676, alpha: 0.4 });
                    }

                    // POC Box
                    if (level.price === candle.poc) {
                        gImbalance.rect(xCenter - halfWidth - 2, y - cellHeight / 2, (halfWidth * 2) + 4, cellHeight);
                        gImbalance.stroke({ width: 2, color: 0xffeb3b, alpha: 1 });
                    }
                });
            }
        });
    }
}
