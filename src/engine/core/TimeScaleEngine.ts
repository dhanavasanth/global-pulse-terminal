
export class TimeScaleEngine {
    private _width: number = 0;
    private _barSpacing: number = 6; // Pixels between bars (center to center)
    private _scrollOffset: number = 0; // Number of bars scrolled from the right (0 = latest bar at right edge)
    private _rightOffset: number = 100; // Pixels of empty space at the right

    constructor() { }

    public setDimensions(width: number) {
        this._width = width;
    }

    public setBarSpacing(spacing: number) {
        this._barSpacing = Math.max(1, Math.min(100, spacing));
    }

    public getBarSpacing() {
        return this._barSpacing;
    }

    public setScrollOffset(offset: number) {
        // Can limit this if needed, but for now allow infinite scrolling
        this._scrollOffset = offset;
    }

    public getScrollOffset() {
        return this._scrollOffset;
    }

    public scroll(delta: number) {
        this._scrollOffset += delta;
    }

    public zoom(delta: number) {
        // Zoom affects bar spacing
        this.setBarSpacing(this._barSpacing * delta);
    }

    /**
     * Converts a simplified "index" of a bar to an X coordinate.
     * Index 0 is the latest bar, Index 1 is the one before it, etc.
     * We typically want index 0 to be near the right edge.
     */
    public indexToX(index: number): number {
        // x = width - rightOffset - (index + scrollOffset) * barSpacing
        // Wait, if scrollOffset is positive, we are "seeing" older bars, so they should shift RIGHT? 
        // No, standard convention:
        // scrollOffset = 0 -> latest bar (index 0) is at (width - rightOffset)
        // scrollOffset = 5 -> latest bar (index 0) is at (width - rightOffset) - shifted?
        // Let's define scrollOffset as "visual offset in bars".
        // A HIGHER scrollOffset means we are looking further back in time.
        // So the graph shifts to the RIGHT.

        // Let's refine:
        // offset from right edge = (index - scrollOffset) * barSpacing
        // x = width - rightOffset - (index * barSpacing) + (scrollOffset * barSpacing)

        const offsetFromRight = (index * this._barSpacing);
        const shift = this._scrollOffset * this._barSpacing;

        return this._width - this._rightOffset - offsetFromRight + shift;
    }

    /**
     * Inverse of indexToX
     */
    public xToIndex(x: number): number {
        // x = W - R - i*S + so*S
        // i*S = W - R + so*S - x
        // i = (W - R - x)/S + so
        const relativeX = this._width - this._rightOffset - x;
        return (relativeX / this._barSpacing) + this._scrollOffset;
    }
}
