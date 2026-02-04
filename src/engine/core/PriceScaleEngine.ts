
export class PriceScaleEngine {
    private _height: number = 0;
    private _minPrice: number = 0;
    private _maxPrice: number = 100;
    private _paddingTop: number = 50;
    private _paddingBottom: number = 50;

    constructor() { }

    public setDimensions(height: number) {
        this._height = height;
    }

    public setRange(min: number, max: number) {
        if (min >= max) return; // robustness
        this._minPrice = min;
        this._maxPrice = max;
    }

    public getRange() {
        return { min: this._minPrice, max: this._maxPrice };
    }

    /**
     * Maps price to Y coordinate.
     * Typically chart: Y=0 is TOP, Y=Height is BOTTOM.
     * High price should be small Y (near top).
     * Low price should be large Y (near bottom).
     */
    public priceToY(price: number): number {
        const range = this._maxPrice - this._minPrice;
        if (range === 0) return this._height / 2;

        const effectiveHeight = this._height - this._paddingTop - this._paddingBottom;

        // Ratio of price within range. 0 = min, 1 = max.
        const ratio = (price - this._minPrice) / range;

        // Invert ratio because Y grows downwards.
        // Y = TopPadding + (1 - ratio) * EffectiveHeight
        return this._paddingTop + (1 - ratio) * effectiveHeight;
    }

    public yToPrice(y: number): number {
        const effectiveHeight = this._height - this._paddingTop - this._paddingBottom;
        const relativeY = y - this._paddingTop;

        // relativeY = (1 - ratio) * H
        // ratio = 1 - (relativeY / H)
        const ratio = 1 - (relativeY / effectiveHeight);
        const range = this._maxPrice - this._minPrice;

        return this._minPrice + (ratio * range);
    }
}
