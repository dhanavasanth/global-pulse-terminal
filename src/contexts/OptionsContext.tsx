import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { isAuthenticated, getLTP, getOptionChain, hasCredentials } from "@/lib/angelone";
import { useAngelOneAuth } from "@/contexts/AngelOneAuthContext";
import type { LTPData, OptionChainData } from "@/lib/angelone";

// Types for options data
export interface OptionData {
    strike: number;
    callPrice: number;
    putPrice: number;
    callOI: number;
    putOI: number;
    callVolume: number;
    putVolume: number;
    callIV: number;
    putIV: number;
    callDelta: number;
    putDelta: number;
    straddlePrice: number;
    callVWAP: number;
    putVWAP: number;
    callPOC: number;
    putPOC: number;
}

export interface STRData {
    time: string;
    callStrength: number;
    putStrength: number;
    callVWAP: number;
    putVWAP: number;
    callPOC: number;
    putPOC: number;
}

export interface StraddleData {
    time: string;
    price: number;
    vwap: number;
    dloc: number;
}

export interface VIXData {
    time: string;
    value: number;
    compression: boolean;
}

export interface MSVEntry {
    strike: number;
    callBias: "bullish" | "bearish";
    putBias: "bullish" | "bearish";
    marketState: "Bull" | "Bear" | "Sideways" | "Volatile";
    isSupport?: boolean;
    isResistance?: boolean;
}

export interface ReEntrySignal {
    time: string;
    type: "call" | "put";
    price: number;
    confirmed: boolean;
}

export interface PriceCandleData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ATMOptionPriceData {
    time: string;
    // Call OHLC
    callOpen: number;
    callHigh: number;
    callLow: number;
    callClose: number;
    callPrice: number; // Keep for compatibility if needed (same as Close)
    // Put OHLC
    putOpen: number;
    putHigh: number;
    putLow: number;
    putClose: number;
    putPrice: number;
    // Straddle OHLC
    straddleOpen: number;
    straddleHigh: number;
    straddleLow: number;
    straddleClose: number;
    straddlePrice: number;
    // Indicators
    callVWAP: number;
    putVWAP: number;
    callPOC: number;
    putPOC: number;
    straddleVWAP: number;
}

export type IndexType = "NIFTY" | "BANKNIFTY" | "SENSEX";

interface OptionsContextType {
    selectedIndex: IndexType;
    setSelectedIndex: (index: IndexType) => void;
    atmStrike: number;
    setAtmStrike: (strike: number) => void;
    expiry: string;
    setExpiry: (expiry: string) => void;
    isLoading: boolean;
    fetchData: () => void;
    isLiveData: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'not_configured';

    // Market data
    spotPrice: number;
    optionsChain: OptionData[];
    strData: STRData[];
    straddleData: StraddleData[];
    vixData: VIXData[];
    msvData: MSVEntry[];
    reEntrySignals: ReEntrySignal[];
    priceData: PriceCandleData[];
    atmOptionPriceData: ATMOptionPriceData[];

    // AI Insights
    aiInsight: {
        bias: string;
        direction: string;
        stopLoss: number;
        target1: number;
        target2: number;
        marketState: string;
        confidence: number;
    };
}

const OptionsContext = createContext<OptionsContextType | undefined>(undefined);

// Token mapping for indices
const INDEX_TOKENS: Record<IndexType, { token: string; exchange: 'NSE' | 'BSE' }> = {
    'NIFTY': { token: '99926000', exchange: 'NSE' },
    'BANKNIFTY': { token: '99926009', exchange: 'NSE' },
    'SENSEX': { token: '99919000', exchange: 'BSE' },
};

// Generate expiry dates (next few Thursdays for NIFTY/BANKNIFTY)
const generateExpiryDates = (): string[] => {
    const dates: string[] = [];
    const now = new Date();

    // Find next 4 Thursdays
    for (let i = 0; dates.length < 4; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        if (date.getDay() === 4) { // Thursday
            dates.push(date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }));
        }
    }
    return dates;
};

// Mock data generators (fallback when not connected)
const generateMockOptionsChain = (atm: number, index: IndexType): OptionData[] => {
    const strikeGap = index === "BANKNIFTY" ? 100 : 50;
    const strikes: OptionData[] = [];

    for (let i = -5; i <= 5; i++) {
        const strike = atm + (i * strikeGap);
        const distance = Math.abs(i);
        const baseCall = Math.max(50, 200 - distance * 30 + Math.random() * 20);
        const basePut = Math.max(50, 200 - distance * 30 + Math.random() * 20);

        strikes.push({
            strike,
            callPrice: baseCall + (i < 0 ? distance * 15 : -distance * 10),
            putPrice: basePut + (i > 0 ? distance * 15 : -distance * 10),
            callOI: Math.floor(50000 + Math.random() * 100000),
            putOI: Math.floor(50000 + Math.random() * 100000),
            callVolume: Math.floor(10000 + Math.random() * 50000),
            putVolume: Math.floor(10000 + Math.random() * 50000),
            callIV: 15 + Math.random() * 10,
            putIV: 15 + Math.random() * 10,
            callDelta: 0.5 - (i * 0.08),
            putDelta: -0.5 + (i * 0.08),
            straddlePrice: baseCall + basePut,
            callVWAP: baseCall * (0.95 + Math.random() * 0.1),
            putVWAP: basePut * (0.95 + Math.random() * 0.1),
            callPOC: baseCall * (0.9 + Math.random() * 0.2),
            putPOC: basePut * (0.9 + Math.random() * 0.2),
        });
    }

    return strikes;
};

const generateMockSTRData = (): STRData[] => {
    const data: STRData[] = [];
    const now = new Date();

    for (let i = 0; i < 78; i++) {
        const time = new Date(now.getTime() - (78 - i) * 5 * 60 * 1000);
        const trend = Math.sin(i * 0.1) * 50;

        data.push({
            time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            callStrength: 50 + trend + (Math.random() - 0.5) * 30,
            putStrength: 50 - trend + (Math.random() - 0.5) * 30,
            callVWAP: 150 + (Math.random() - 0.5) * 20,
            putVWAP: 150 + (Math.random() - 0.5) * 20,
            callPOC: 145 + (Math.random() - 0.5) * 25,
            putPOC: 145 + (Math.random() - 0.5) * 25,
        });
    }

    return data;
};

const generateMockStraddleData = (): StraddleData[] => {
    const data: StraddleData[] = [];
    const now = new Date();
    let price = 350;
    let vwap = 345;

    for (let i = 0; i < 78; i++) {
        const time = new Date(now.getTime() - (78 - i) * 5 * 60 * 1000);
        price += (Math.random() - 0.5) * 10;
        vwap = vwap * 0.95 + price * 0.05;

        data.push({
            time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            price: Math.max(200, price),
            vwap,
            dloc: vwap * 0.98,
        });
    }

    return data;
};

const generateMockVIXData = (): VIXData[] => {
    const data: VIXData[] = [];
    const now = new Date();
    let vix = 14;

    for (let i = 0; i < 78; i++) {
        const time = new Date(now.getTime() - (78 - i) * 5 * 60 * 1000);
        vix += (Math.random() - 0.5) * 0.5;
        vix = Math.max(10, Math.min(25, vix));

        data.push({
            time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            value: vix,
            compression: vix < 13,
        });
    }

    return data;
};

const generateMockMSVData = (atm: number, index: IndexType): MSVEntry[] => {
    const strikeGap = index === "BANKNIFTY" ? 100 : 50;
    const data: MSVEntry[] = [];

    for (let i = -2; i <= 2; i++) {
        const strike = atm + (i * strikeGap);
        const callBias = Math.random() > 0.5 ? "bullish" : "bearish";
        const putBias = Math.random() > 0.5 ? "bullish" : "bearish";

        let marketState: MSVEntry["marketState"];
        if (callBias === "bullish" && putBias === "bearish") marketState = "Bull";
        else if (callBias === "bearish" && putBias === "bullish") marketState = "Bear";
        else if (callBias === "bullish" && putBias === "bullish") marketState = "Volatile";
        else marketState = "Sideways";

        data.push({
            strike,
            callBias,
            putBias,
            marketState,
            isSupport: i === -2 && marketState === "Bull",
            isResistance: i === 2 && marketState === "Bear",
        });
    }

    return data;
};

const generateMockReEntrySignals = (): ReEntrySignal[] => {
    return [
        { time: "10:15", type: "call", price: 24850, confirmed: true },
        { time: "11:30", type: "put", price: 24920, confirmed: true },
        { time: "14:00", type: "call", price: 24780, confirmed: false },
    ];
};

const generateMockPriceData = (basePrice: number): PriceCandleData[] => {
    const data: PriceCandleData[] = [];
    const now = new Date();
    let currentPrice = basePrice;

    for (let i = 0; i < 78; i++) {
        const time = new Date(now.getTime() - (78 - i) * 5 * 60 * 1000);
        const volatility = 15 + Math.random() * 10;
        const trend = Math.sin(i * 0.08) * 30;

        const open = currentPrice;
        const change = (Math.random() - 0.48) * volatility + trend * 0.1;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;

        currentPrice = close;

        data.push({
            time: time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: Math.floor(50000 + Math.random() * 150000),
        });
    }

    return data;
};

// --------------------------------------------------------------------------
// Real-Time Indicator Calculations (PRD Implementation)
// --------------------------------------------------------------------------

/**
 * Calculates STR (Strength Indicator), MSV (Market Sentiment Value), 
 * POC (Point of Control), and generates AI Insights from live data.
 */
const calculateRealIndicators = (
    chain: OptionData[],
    spotPrice: number,
    atmStrike: number,
    previousSTRData: STRData[] = []
) => {
    // 1. Calculate STR (Overall Call vs Put Volume Strength)
    // -----------------------------------------------------
    const totalCallVol = chain.reduce((acc, c) => acc + c.callVolume, 0);
    const totalPutVol = chain.reduce((acc, c) => acc + c.putVolume, 0);
    const totalVol = totalCallVol + totalPutVol || 1; // Avoid divide by zero

    const callStrength = (totalCallVol / totalVol) * 100;
    const putStrength = (totalPutVol / totalVol) * 100;

    // Calculate POC (Strike with highest Volume for Call and Put)
    let maxCallVol = 0;
    let maxPutVol = 0;
    let callPOCStrike = atmStrike;
    let putPOCStrike = atmStrike;

    chain.forEach(c => {
        if (c.callVolume > maxCallVol) {
            maxCallVol = c.callVolume;
            callPOCStrike = c.strike;
        }
        if (c.putVolume > maxPutVol) {
            maxPutVol = c.putVolume;
            putPOCStrike = c.strike;
        }
    });

    // VWAP approximation (simplified as weighted average of strikes by volume)
    // Real VWAP requires time-series trade data, which we approximate here for snapshot
    const callVWAP = chain.reduce((acc, c) => acc + (c.strike * c.callVolume), 0) / (totalCallVol || 1);
    const putVWAP = chain.reduce((acc, c) => acc + (c.strike * c.putVolume), 0) / (totalPutVol || 1);

    const currentSTR: STRData = {
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        callStrength,
        putStrength,
        callVWAP,
        putVWAP,
        callPOC: callPOCStrike,
        putPOC: putPOCStrike
    };

    // 2. Calculate MSV (Market Sentiment Value for 5 strikes around ATM)
    // ------------------------------------------------------------------
    // Filter strikes ATM-2 to ATM+2
    // Assuming chain is sorted by strike
    const atmIndex = chain.findIndex(c => c.strike === atmStrike);
    let msvEntries: MSVEntry[] = [];

    if (atmIndex !== -1) {
        const startIndex = Math.max(0, atmIndex - 2);
        const endIndex = Math.min(chain.length - 1, atmIndex + 2);

        for (let i = startIndex; i <= endIndex; i++) {
            const row = chain[i];

            // Bias Logic per Strike
            const pcrStrike = row.callOI > 0 ? row.putOI / row.callOI : 1;
            const callBias: "bullish" | "bearish" = pcrStrike > 1 ? "bullish" : "bearish";
            const putBias: "bullish" | "bearish" = pcrStrike > 1 ? "bullish" : "bearish";

            // Market State Logic
            let marketState: "Bull" | "Bear" | "Sideways" | "Volatile" = "Sideways";
            if (pcrStrike > 1.5) marketState = "Bull";
            else if (pcrStrike < 0.7) marketState = "Bear";
            else if (row.callVolume > 100000 && row.putVolume > 100000) marketState = "Volatile";

            msvEntries.push({
                strike: row.strike,
                callBias,
                putBias,
                marketState,
                isSupport: row.putOI > row.callOI * 1.5,
                isResistance: row.callOI > row.putOI * 1.5
            });
        }
    } else {
        // Fallback if ATM not found exactly
        msvEntries = generateMockMSVData(atmStrike, "NIFTY");
    }

    // 3. Generate AI Insights
    // -----------------------
    const trend = callStrength > putStrength ? "Call Dominant" : "Put Dominant";
    const bias = callStrength > 55 ? "Bullish" : putStrength > 55 ? "Bearish" : "Neutral";
    const conf = Math.max(callStrength, putStrength);

    // StopLoss/Targets based on POC
    const stopLoss = trend === "Call Dominant" ? putPOCStrike : callPOCStrike;
    const target1 = trend === "Call Dominant" ? callPOCStrike : putPOCStrike;

    const insights = {
        bias,
        direction: trend,
        stopLoss,
        target1,
        target2: target1 + (target1 - spotPrice),
        marketState: Math.abs(callStrength - putStrength) < 10 ? "Sideways" : "Trending",
        confidence: Math.round(conf)
    };

    return {
        strData: [...previousSTRData.slice(-50), currentSTR], // Keep last 50 points
        msvData: msvEntries,
        aiInsight: insights
    };
};

const generateMockATMOptionPriceData = (): ATMOptionPriceData[] => {
    const data: ATMOptionPriceData[] = [];
    const now = new Date();

    // Initial Prices
    let callPrice = 137;
    let putPrice = 134;

    let callVWAP = callPrice;
    let putVWAP = putPrice;
    const callPOC = callPrice * 0.95;
    const putPOC = putPrice * 0.95;

    for (let i = 0; i < 78; i++) {
        // Time entries every 5 mins
        const timeDate = new Date(now.getTime() - (78 - i) * 5 * 60 * 1000);
        const timeString = timeDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

        const volatility = 4;

        // Generate Call Candle
        const callOpen = callPrice;
        const callChange = (Math.random() - 0.48) * volatility;
        const callClose = callOpen + callChange;
        const callHigh = Math.max(callOpen, callClose) + Math.random() * 2;
        const callLow = Math.min(callOpen, callClose) - Math.random() * 2;
        callPrice = callClose; // Next open

        // Generate Put Candle
        const putOpen = putPrice;
        const putChange = (Math.random() - 0.52) * volatility; // Inverse correlation slightly
        const putClose = putOpen + putChange;
        const putHigh = Math.max(putOpen, putClose) + Math.random() * 2;
        const putLow = Math.min(putOpen, putClose) - Math.random() * 2;
        putPrice = putClose;

        // Straddle Candle (Sum of Call + Put)
        const straddleOpen = callOpen + putOpen;
        const straddleClose = callClose + putClose;
        const straddleHigh = callHigh + putHigh; // Approximation
        const straddleLow = callLow + putLow;

        // VWAP Adjustments
        callVWAP = callVWAP * 0.95 + callClose * 0.05;
        putVWAP = putVWAP * 0.95 + putClose * 0.05;
        const straddleVWAP = callVWAP + putVWAP;

        data.push({
            time: timeString,
            callOpen: Math.round(callOpen * 100) / 100,
            callHigh: Math.round(callHigh * 100) / 100,
            callLow: Math.round(callLow * 100) / 100,
            callClose: Math.round(callClose * 100) / 100,
            putOpen: Math.round(putOpen * 100) / 100,
            putHigh: Math.round(putHigh * 100) / 100,
            putLow: Math.round(putLow * 100) / 100,
            putClose: Math.round(putClose * 100) / 100,
            straddleOpen: Math.round(straddleOpen * 100) / 100,
            straddleHigh: Math.round(straddleHigh * 100) / 100,
            straddleLow: Math.round(straddleLow * 100) / 100,
            straddleClose: Math.round(straddleClose * 100) / 100,
            callVWAP: Math.round(callVWAP * 100) / 100,
            putVWAP: Math.round(putVWAP * 100) / 100,
            callPOC: Math.round(callPOC * 100) / 100,
            putPOC: Math.round(putPOC * 100) / 100,
            straddleVWAP: Math.round(straddleVWAP * 100) / 100,
            // Legacy fields mapped to Close for compatibility
            callPrice: Math.round(callClose * 100) / 100,
            putPrice: Math.round(putClose * 100) / 100,
            straddlePrice: Math.round(straddleClose * 100) / 100
        });
    }

    return data;
};

export const OptionsProvider = ({ children }: { children: ReactNode }) => {
    const [selectedIndex, setSelectedIndex] = useState<IndexType>("NIFTY");
    const [atmStrike, setAtmStrike] = useState(24850);
    const [expiry, setExpiry] = useState(generateExpiryDates()[0] || "30-Jan-2026");
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveData, setIsLiveData] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'not_configured'>('not_configured');

    // Use auth context for logout capability
    const { logoutUser } = useAngelOneAuth();

    // Market data state
    const [spotPrice, setSpotPrice] = useState(24856.50);
    const [optionsChain, setOptionsChain] = useState<OptionData[]>([]);
    const [strData, setStrData] = useState<STRData[]>([]);
    const [straddleData, setStraddleData] = useState<StraddleData[]>([]);
    const [vixData, setVixData] = useState<VIXData[]>([]);
    const [msvData, setMsvData] = useState<MSVEntry[]>([]);
    const [reEntrySignals, setReEntrySignals] = useState<ReEntrySignal[]>([]);
    const [priceData, setPriceData] = useState<PriceCandleData[]>([]);
    const [atmOptionPriceData, setAtmOptionPriceData] = useState<ATMOptionPriceData[]>([]);

    const [aiInsight, setAiInsight] = useState({
        bias: "Bullish",
        direction: "Call Dominant",
        stopLoss: 24750,
        target1: 24950,
        target2: 25050,
        marketState: "Trending",
        confidence: 78,
    });

    // Check connection status
    useEffect(() => {
        if (!hasCredentials()) {
            setConnectionStatus('not_configured');
        } else if (isAuthenticated()) {
            setConnectionStatus('connected');
        } else {
            setConnectionStatus('disconnected');
        }
    }, []);

    // Fetch real spot price from Angel One
    const fetchRealSpotPrice = useCallback(async (): Promise<number | null> => {
        if (!isAuthenticated()) return null;

        try {
            const indexInfo = INDEX_TOKENS[selectedIndex];
            const exchangeTokens = { [indexInfo.exchange]: [indexInfo.token] };
            const data = await getLTP(exchangeTokens);

            if (data && data.length > 0) {
                return data[0].ltp;
            }
        } catch (error) {
            console.error('Failed to fetch spot price:', error);
        }
        return null;
    }, [selectedIndex]);

    // Fetch real options chain from Angel One
    const fetchRealOptionsChain = useCallback(async (spotPrice: number): Promise<OptionData[] | null> => {
        if (!isAuthenticated() || selectedIndex === 'SENSEX') return null;

        try {
            // Format expiry for Angel One (DDMMMYYYY)
            const expiryDate = new Date(expiry);
            const formattedExpiry = expiryDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, '').toUpperCase();

            const chainData = await getOptionChain(
                selectedIndex as 'NIFTY' | 'BANKNIFTY',
                formattedExpiry
            );

            if (chainData && chainData.contracts) {
                // Convert to OptionData format
                const strikeMap = new Map<number, OptionData>();

                for (const contract of chainData.contracts) {
                    if (!strikeMap.has(contract.strikePrice)) {
                        strikeMap.set(contract.strikePrice, {
                            strike: contract.strikePrice,
                            callPrice: 0,
                            putPrice: 0,
                            callOI: 0,
                            putOI: 0,
                            callVolume: 0,
                            putVolume: 0,
                            callIV: 0,
                            putIV: 0,
                            callDelta: 0,
                            putDelta: 0,
                            straddlePrice: 0,
                            callVWAP: 0,
                            putVWAP: 0,
                            callPOC: 0,
                            putPOC: 0,
                        });
                    }

                    const option = strikeMap.get(contract.strikePrice)!;

                    if (contract.optionType === 'CE') {
                        option.callPrice = contract.ltp;
                        option.callOI = contract.oi;
                        option.callVolume = contract.volume;
                        option.callIV = contract.iv;
                        option.callDelta = contract.delta;
                        option.callVWAP = contract.ltp * 0.98;
                        option.callPOC = contract.ltp * 0.95;
                    } else {
                        option.putPrice = contract.ltp;
                        option.putOI = contract.oi;
                        option.putVolume = contract.volume;
                        option.putIV = contract.iv;
                        option.putDelta = contract.delta;
                        option.putVWAP = contract.ltp * 0.98;
                        option.putPOC = contract.ltp * 0.95;
                    }

                    option.straddlePrice = option.callPrice + option.putPrice;
                }

                return Array.from(strikeMap.values()).sort((a, b) => a.strike - b.strike);
            }
        } catch (error) {
            console.error('Failed to fetch options chain:', error);
        }
        return null;
    }, [selectedIndex, expiry]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        try {
            let currentSpotPrice = spotPrice; // Default to current or last known
            let currentChain: OptionData[] = [];
            let isRealData = false;
            let currentAtm = atmStrike;

            // 1. Try to fetch REAL data
            if (hasCredentials() && isAuthenticated()) {
                const realSpotPrice = await fetchRealSpotPrice();

                if (realSpotPrice) {
                    currentSpotPrice = realSpotPrice;

                    // Calculate ATM
                    const strikeGap = selectedIndex === "BANKNIFTY" ? 100 : 50;
                    currentAtm = Math.round(realSpotPrice / strikeGap) * strikeGap;

                    // Fetch Chain
                    const realChain = await fetchRealOptionsChain(realSpotPrice);
                    if (realChain && realChain.length > 0) {
                        currentChain = realChain;
                        isRealData = true;
                        setConnectionStatus('connected');
                    }
                }
            }

            // 2. Fallback to MOCK data if no real data retrieved
            if (!isRealData || currentChain.length === 0) {
                setConnectionStatus(hasCredentials() ? 'disconnected' : 'not_configured');

                const baseATM = selectedIndex === "BANKNIFTY" ? 52500 :
                    selectedIndex === "SENSEX" ? 81500 : 24850;

                currentAtm = baseATM;
                if (!isRealData) {
                    currentSpotPrice = baseATM + (Math.random() - 0.5) * 100;
                }

                currentChain = generateMockOptionsChain(baseATM, selectedIndex);
            }

            // 3. Update State
            setSpotPrice(currentSpotPrice);
            setAtmStrike(currentAtm);
            setOptionsChain(currentChain);
            setIsLiveData(isRealData);

            // 4. Calculate Indicators (Works for both Real and Mock chain)
            const { strData: newSTR, msvData: newMSV, aiInsight: newInsight } = calculateRealIndicators(
                currentChain,
                currentSpotPrice,
                currentAtm,
                strData
            );

            setStrData(newSTR);
            setMsvData(newMSV);
            setAiInsight(newInsight);

            // 5. Generate auxiliary data
            // Mock for chart time-series data we don't store yet
            setStraddleData(generateMockStraddleData());
            setVixData(generateMockVIXData());
            setReEntrySignals(generateMockReEntrySignals());
            setPriceData(generateMockPriceData(currentSpotPrice));
            setAtmOptionPriceData(generateMockATMOptionPriceData());

        } catch (error) {
            console.error('Error fetching data:', error);
            setIsLiveData(false);
            setConnectionStatus('disconnected');

            if (error instanceof Error && (error.message.includes('Invalid Token') || error.message.includes('AG8001'))) {
                console.warn('Session expired or invalid, logging out...');
                logoutUser();
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedIndex, fetchRealSpotPrice, fetchRealOptionsChain, logoutUser, spotPrice, atmStrike, strData]);

    // Auto-refresh every 30 seconds when connected
    useEffect(() => {
        if (connectionStatus === 'connected') {
            const interval = setInterval(() => {
                fetchData();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [connectionStatus, fetchData]);

    return (
        <OptionsContext.Provider value={{
            selectedIndex,
            setSelectedIndex,
            atmStrike,
            setAtmStrike,
            expiry,
            setExpiry,
            isLoading,
            fetchData,
            isLiveData,
            connectionStatus,
            spotPrice,
            optionsChain,
            strData,
            straddleData,
            vixData,
            msvData,
            reEntrySignals,
            priceData,
            atmOptionPriceData,
            aiInsight,
        }}>
            {children}
        </OptionsContext.Provider>
    );
};

export const useOptions = () => {
    const context = useContext(OptionsContext);
    if (!context) {
        throw new Error("useOptions must be used within OptionsProvider");
    }
    return context;
};
