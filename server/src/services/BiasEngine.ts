export interface BiasFactors {
    sgxNiftyChange: number;
    usMarketTrend: 'UP' | 'DOWN' | 'FLAT';
    asianMarketTrend: 'UP' | 'DOWN' | 'MIXED';
    usdinrChange: number;
    crudeOilChange: number;
    newsSentimentScore: number; // -1 to 1
}

export const calculateBiasScore = (factors: BiasFactors): { score: number; bias: string; breakdown: any } => {
    let score = 0;

    // 1. SGX NIFTY Impact (High Weight)
    // If SGX is up > 0.5%, strong bullish (+1). If > 0.1%, mild bullish (+0.5).
    if (factors.sgxNiftyChange > 0.5) score += 1.0;
    else if (factors.sgxNiftyChange > 0.0) score += 0.5;
    else if (factors.sgxNiftyChange < -0.5) score -= 1.0;
    else score -= 0.5;

    // 2. US Market Trend (Medium Weight)
    if (factors.usMarketTrend === 'UP') score += 0.5;
    else if (factors.usMarketTrend === 'DOWN') score -= 0.5;

    // 3. Asian Markets (Low Weight)
    if (factors.asianMarketTrend === 'UP') score += 0.3;
    else if (factors.asianMarketTrend === 'DOWN') score -= 0.3;

    // 4. USDINR (Inverse Correlation)
    // If USDINR goes UP, Equity usually goes DOWN
    if (factors.usdinrChange > 0.1) score -= 0.4;
    else if (factors.usdinrChange < -0.1) score += 0.4;

    // 5. Crude Oil (Inverse Correlation for India)
    if (factors.crudeOilChange > 1.0) score -= 0.3;
    else if (factors.crudeOilChange < -1.0) score += 0.3;

    // 6. News Sentiment (Variable Weight)
    score += factors.newsSentimentScore * 0.8;

    // Normalize Score to -3 to +3 Range roughly, then clamp or categorize
    // Bucket logic
    let bias = 'NEUTRAL';
    if (score > 1.5) bias = 'STRONG_BULLISH';
    else if (score > 0.5) bias = 'MILD_BULLISH';
    else if (score < -1.5) bias = 'STRONG_BEARISH';
    else if (score < -0.5) bias = 'MILD_BEARISH';

    return {
        score: parseFloat(score.toFixed(2)),
        bias,
        breakdown: factors
    };
};

// Mock Data Generator for Development
export const getMockBiasFactors = (): BiasFactors => {
    return {
        sgxNiftyChange: Math.random() * 2 - 1, // -1% to +1%
        usMarketTrend: Math.random() > 0.5 ? 'UP' : 'DOWN',
        asianMarketTrend: Math.random() > 0.5 ? 'UP' : 'DOWN',
        usdinrChange: Math.random() * 0.5 - 0.25,
        crudeOilChange: Math.random() * 4 - 2,
        newsSentimentScore: Math.random() * 2 - 1 // -1 to 1
    };
};
