
import { TimeScaleEngine } from "./TimeScaleEngine";
import { PriceScaleEngine } from "./PriceScaleEngine";

export class CoordinateMapper {
    private _timeScale: TimeScaleEngine;
    private _priceScale: PriceScaleEngine;

    constructor(timeScale: TimeScaleEngine, priceScale: PriceScaleEngine) {
        this._timeScale = timeScale;
        this._priceScale = priceScale;
    }

    public toPixel(index: number, price: number): { x: number, y: number } {
        return {
            x: this._timeScale.indexToX(index),
            y: this._priceScale.priceToY(price)
        };
    }

    public toData(x: number, y: number): { index: number, price: number } {
        return {
            index: this._timeScale.xToIndex(x),
            price: this._priceScale.yToPrice(y)
        };
    }
}
