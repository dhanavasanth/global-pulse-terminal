export interface NewsItem {
    id: string;
    headline: string;
    source: string;
    timestamp: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    score: number; // -1 to 1
    url?: string;
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        headline: "Fed signals rate cuts starting next quarter",
        source: "Bloomberg",
        timestamp: new Date().toISOString(),
        sentiment: "POSITIVE",
        score: 0.8
    },
    {
        id: '2',
        headline: "Crude oil prices surge amidst geopolitical tensions",
        source: "Reuters",
        timestamp: new Date().toISOString(),
        sentiment: "NEGATIVE", // Bad for India
        score: -0.6
    },
    {
        id: '3',
        headline: "TCS reports strong Q3 earnings, beats estimates",
        source: "MoneyControl",
        timestamp: new Date().toISOString(),
        sentiment: "POSITIVE",
        score: 0.7
    },
    {
        id: '4',
        headline: "Rupee hits all-time low against dollar",
        source: "CNBC TV18",
        timestamp: new Date().toISOString(),
        sentiment: "NEGATIVE",
        score: -0.5
    },
    {
        id: '5',
        headline: "Market awaits inflation data release",
        source: "Investing.com",
        timestamp: new Date().toISOString(),
        sentiment: "NEUTRAL",
        score: 0.0
    }
];

export const getLatestNews = async (): Promise<NewsItem[]> => {
    // In production, fetch from NewsAPI here
    return MOCK_NEWS;
};

export const calculateAggregateSentiment = (news: NewsItem[]): number => {
    if (news.length === 0) return 0;
    const totalScore = news.reduce((acc, item) => acc + item.score, 0);
    return totalScore / news.length;
};
