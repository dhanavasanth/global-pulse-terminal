import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Types ---

export interface OrderFlowTick {
    price: number;
    size: number;
    side: "buy" | "sell";
    time: number;
}

export interface PriceLevel {
    price: number;
    bidVol: number;
    askVol: number;
    delta: number;
    totalVol: number;
    imbalances: {
        bid: boolean; // True if Bid Vol > Ask Vol * ratio
        ask: boolean; // True if Ask Vol > Bid Vol * ratio
    };
}

export interface FootprintCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    delta: number;
    cumDelta: number; // CVD
    poc: number; // Price of Control (max volume level)
    levels: PriceLevel[];
    isFinished: boolean;
}

export interface DOMLevel {
    price: number;
    bidLimit: number;
    askLimit: number;
}

export interface AssetDef {
    type: "Index" | "Stock" | "Crypto" | "Forex" | "Commodity";
    tickSize: number;
    decimals: number;
    basePrice: number;
}

export interface OrderFlowContextType {
    isConnected: boolean;
    symbol: string;
    setSymbol: (s: string) => void;
    timeframe: string; // '1s', '5s', '1m', etc.
    setTimeframe: (t: string) => void;

    // Data
    candles: FootprintCandle[];
    currentCandle: FootprintCandle | null;
    dom: DOMLevel[];
    lastPrice: number;

    // Asset Meta
    tickSize: number;
    decimals: number;
    assets: Record<string, AssetDef>;

    // Settings
    imbalanceRatio: number;
    setImbalanceRatio: (r: number) => void;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- Mock Assets ---

export const ASSETS: Record<string, AssetDef> = {
    "NIFTY 50": { type: "Index", tickSize: 5, decimals: 2, basePrice: 24850 },
    "BANKNIFTY": { type: "Index", tickSize: 50, decimals: 2, basePrice: 48000 },
    "RELIANCE": { type: "Stock", tickSize: 0.05, decimals: 2, basePrice: 2500 },
    "HDFCBANK": { type: "Stock", tickSize: 0.05, decimals: 2, basePrice: 1500 },
    "BTCUSD": { type: "Crypto", tickSize: 0.5, decimals: 1, basePrice: 65000 },
    "ETHUSD": { type: "Crypto", tickSize: 0.1, decimals: 1, basePrice: 3500 },
    "XAUUSD": { type: "Commodity", tickSize: 0.01, decimals: 2, basePrice: 2030 },
    "EURUSD": { type: "Forex", tickSize: 0.00005, decimals: 5, basePrice: 1.0850 }
};

const generateEmptyLevel = (price: number): PriceLevel => ({
    price,
    bidVol: 0,
    askVol: 0,
    delta: 0,
    totalVol: 0,
    imbalances: { bid: false, ask: false },
});

export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
    const [symbol, setSymbol] = useState("NIFTY 50");
    const [timeframe, setTimeframe] = useState("5s");
    const [imbalanceRatio, setImbalanceRatio] = useState(3);

    const [isConnected, setIsConnected] = useState(false);
    const [candles, setCandles] = useState<FootprintCandle[]>([]);
    const [currentCandle, setCurrentCandle] = useState<FootprintCandle | null>(null);
    const [dom, setDom] = useState<DOMLevel[]>([]);
    const [lastPrice, setLastPrice] = useState(ASSETS["NIFTY 50"].basePrice);

    // --- Simulation Effect ---
    useEffect(() => {
        setIsConnected(true);
        let interval: NodeJS.Timeout;

        const currentAsset = ASSETS[symbol] || ASSETS["NIFTY 50"];
        const TICK_SIZE = currentAsset.tickSize;
        const BASE_PRICE = currentAsset.basePrice;

        // Volume thresholds for "finishing" a candle based on timeframe
        const VOL_THRESHOLDS: Record<string, number> = {
            "Tick": 25,
            "1s": 100,
            "5s": 500,
            "1m": 3000,
            "5m": 15000,
            "1h": 100000,
            "4h": 400000
        };
        const candleVolLimit = VOL_THRESHOLDS[timeframe] || 500;

        // Initial Mock Data (Historical)
        const initialCandles: FootprintCandle[] = [];
        let currPrice = lastPrice === ASSETS["NIFTY 50"].basePrice ? BASE_PRICE : lastPrice; // Use previous price if switching symbols
        // Actually, better to reset price on symbol change or keep it distinct. 
        // For simplicity, let's reset to base price if the "lastPrice" is far off (indicating a switch).
        // But we don't have track of previous symbol here. 
        // Let's just always reset to basePrice on mount/symbol change for simulation.
        currPrice = BASE_PRICE;

        let runningCVD = 0;

        // Generate 10 historical candles
        for (let i = 0; i < 10; i++) {
            const candleTime = Date.now() - (10 - i) * (timeframe.includes('m') ? 60000 : 5000);
            const open = currPrice;
            // Random move
            const move = (Math.floor(Math.random() * 5) - 2) * TICK_SIZE;
            const close = Number((open + move).toFixed(currentAsset.decimals));
            const high = Number((Math.max(open, close) + TICK_SIZE).toFixed(currentAsset.decimals));
            const low = Number((Math.min(open, close) - TICK_SIZE).toFixed(currentAsset.decimals));

            const levels: PriceLevel[] = [];
            let vol = 0;
            let barDelta = 0;

            // Populate levels with precision handling
            for (let p = low; p <= high; p += TICK_SIZE) {
                // Fix floating point issues
                const price = Number(p.toFixed(currentAsset.decimals));

                const askV = Math.floor(Math.random() * (candleVolLimit / 10));
                const bidV = Math.floor(Math.random() * (candleVolLimit / 10));
                const levelVol = askV + bidV;
                const levelDelta = askV - bidV;

                levels.push({
                    price,
                    bidVol: bidV,
                    askVol: askV,
                    delta: levelDelta,
                    totalVol: levelVol,
                    imbalances: {
                        bid: bidV > askV * imbalanceRatio,
                        ask: askV > bidV * imbalanceRatio
                    }
                });

                vol += levelVol;
                barDelta += levelDelta;
            }

            runningCVD += barDelta;

            initialCandles.push({
                time: candleTime,
                open, high, low, close,
                volume: vol,
                delta: barDelta,
                cumDelta: runningCVD,
                poc: levels.reduce((a, b) => a.totalVol > b.totalVol ? a : b).price,
                levels: levels.sort((a, b) => b.price - a.price), // Descending price
                isFinished: true
            });

            currPrice = close;
        }
        setCandles(initialCandles);
        setLastPrice(currPrice);

        // Start current candle
        setCurrentCandle({
            time: Date.now(),
            open: currPrice,
            high: currPrice,
            low: currPrice,
            close: currPrice,
            volume: 0,
            delta: 0,
            cumDelta: runningCVD,
            poc: currPrice,
            levels: [generateEmptyLevel(currPrice)],
            isFinished: false
        });

        // Live Ticker
        interval = setInterval(() => {
            setLastPrice(prev => {
                const move = Math.random() > 0.5 ? TICK_SIZE : -TICK_SIZE;
                const priceMove = Math.random() > 0.7 ? move : 0;
                const newPrice = Number((prev + priceMove).toFixed(currentAsset.decimals));

                setCurrentCandle(curr => {
                    if (!curr) return null;

                    // Simulate a trade size proportional to timeframe
                    const isLargeFrame = timeframe.includes('h') || timeframe === '5m';
                    const baseSize = isLargeFrame ? 50 : 5;

                    const side = Math.random() > 0.5 ? 'buy' : 'sell';
                    const size = Math.floor(Math.random() * baseSize * 2) + 1;

                    const levels = [...curr.levels];
                    // Fuzzy match for float
                    let levelIndex = levels.findIndex(l => Math.abs(l.price - newPrice) < TICK_SIZE / 10);

                    if (levelIndex === -1) {
                        levels.push(generateEmptyLevel(newPrice));
                        levels.sort((a, b) => b.price - a.price);
                        levelIndex = levels.findIndex(l => Math.abs(l.price - newPrice) < TICK_SIZE / 10);
                    }

                    if (levelIndex !== -1) {
                        const level = levels[levelIndex];
                        if (side === 'buy') level.askVol += size;
                        else level.bidVol += size;

                        level.totalVol += size;
                        level.delta += (side === 'buy' ? size : -size);

                        // Check Imbalance
                        level.imbalances.ask = level.askVol > level.bidVol * imbalanceRatio && level.bidVol > 0;
                        level.imbalances.bid = level.bidVol > level.askVol * imbalanceRatio && level.askVol > 0;
                    }

                    const newTotalVol = curr.volume + size;
                    const newDelta = curr.delta + (side === 'buy' ? size : -size);
                    const newHigh = Number(Math.max(curr.high, newPrice).toFixed(currentAsset.decimals));
                    const newLow = Number(Math.min(curr.low, newPrice).toFixed(currentAsset.decimals));

                    // Recalculate POC
                    const newPoc = levels.reduce((a, b) => a.totalVol > b.totalVol ? a : b).price;

                    // Dynamic Finish Logic
                    if (newTotalVol > candleVolLimit) { // candle is "full"
                        const finishedCandle = {
                            ...curr,
                            close: newPrice,
                            high: newHigh,
                            low: newLow,
                            levels,
                            volume: newTotalVol,
                            delta: newDelta,
                            poc: newPoc,
                            isFinished: true
                        };

                        setCandles(prevC => {
                            const newHist = [...prevC.slice(-19), finishedCandle];
                            return newHist;
                        });

                        // Start New
                        return {
                            time: Date.now(),
                            open: newPrice,
                            high: newPrice,
                            low: newPrice,
                            close: newPrice,
                            volume: 0,
                            delta: 0,
                            cumDelta: curr.cumDelta + newDelta,
                            poc: newPrice,
                            levels: [generateEmptyLevel(newPrice)],
                            isFinished: false
                        };
                    }

                    return {
                        ...curr,
                        close: newPrice,
                        high: newHigh,
                        low: newLow,
                        volume: newTotalVol,
                        delta: newDelta,
                        poc: newPoc,
                        levels
                    };
                });

                return newPrice;
            });

            // Mock DOM Data
            setDom(prevDom => {
                const center = Math.round(lastPrice / TICK_SIZE) * TICK_SIZE;
                const newDom: DOMLevel[] = [];
                for (let i = 10; i > 0; i--) {
                    const p = Number((center + (i * TICK_SIZE)).toFixed(currentAsset.decimals));
                    newDom.push({ price: p, askLimit: Math.floor(Math.random() * 500), bidLimit: 0 });
                }
                for (let i = 0; i < 10; i++) {
                    const p = Number((center - (i * TICK_SIZE)).toFixed(currentAsset.decimals));
                    newDom.push({ price: p, askLimit: 0, bidLimit: Math.floor(Math.random() * 500) });
                }
                return newDom;
            });

        }, 50); // Fast ticks (50ms)

        return () => clearInterval(interval);
    }, [imbalanceRatio, timeframe, symbol]); // Re-run when symbol changes

    return (
        <OrderFlowContext.Provider value={{
            isConnected,
            symbol, setSymbol,
            timeframe, setTimeframe,
            candles,
            currentCandle,
            dom,
            lastPrice,

            // Asset Info
            tickSize: ASSETS[symbol]?.tickSize || 5,
            decimals: ASSETS[symbol]?.decimals || 2,
            assets: ASSETS,

            imbalanceRatio, setImbalanceRatio
        }}>
            {children}
        </OrderFlowContext.Provider>
    );
};

export const useOrderFlow = () => {
    const context = useContext(OrderFlowContext);
    if (!context) throw new Error("useOrderFlow must be used within OrderFlowProvider");
    return context;
};
