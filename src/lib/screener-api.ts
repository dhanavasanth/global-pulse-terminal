
// src/lib/screener-api.ts

export interface FundamentalData {
    metric: string;
    mar2024: string;
    mar2023: string;
    mar2022: string;
    yoy: string;
}

export interface SentimentData {
    sentiment: number;
    confidence: number;
    source_mix: {
        news: number;
        filings: number;
        macro: number;
    };
}

export interface MarketContext {
    index_bias: string;
    sector_strength: number;
}

export const getFundamentalData = (ticker: string): FundamentalData[] => {
    // Mock data for demo
    return [
        { metric: "Revenue", mar2024: "₹2,40,000 Cr", mar2023: "₹2,25,000 Cr", mar2022: "₹1,95,000 Cr", yoy: "+6.6%" },
        { metric: "Net Profit", mar2024: "₹45,000 Cr", mar2023: "₹42,000 Cr", mar2022: "₹38,000 Cr", yoy: "+7.1%" },
        { metric: "EPS", mar2024: "₹122.5", mar2023: "₹115.2", mar2022: "₹104.8", yoy: "+6.3%" },
        { metric: "ROE", mar2024: "48%", mar2023: "46%", mar2022: "44%", yoy: "+200bps" },
    ];
};

export const getSentimentData = (ticker: string): SentimentData => {
    return {
        sentiment: 0.72,
        confidence: 0.81,
        source_mix: {
            news: 60,
            filings: 25,
            macro: 15
        }
    };
};

export const getMarketContext = (): MarketContext => {
    return {
        index_bias: "bullish",
        sector_strength: 68
    };
};
