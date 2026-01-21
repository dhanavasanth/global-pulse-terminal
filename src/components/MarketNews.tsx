import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment: "bullish" | "bearish" | "neutral";
  tickers: string[];
}

const newsItems: NewsItem[] = [
  {
    id: "1",
    headline: "Fed Signals Potential Rate Cut in Q1 2026 Amid Cooling Inflation",
    source: "Reuters",
    time: "2m ago",
    sentiment: "bullish",
    tickers: ["SPY", "QQQ", "TLT"],
  },
  {
    id: "2",
    headline: "Apple Unveils Revolutionary AI Chip, Stock Surges in Pre-Market",
    source: "Bloomberg",
    time: "15m ago",
    sentiment: "bullish",
    tickers: ["AAPL", "NVDA"],
  },
  {
    id: "3",
    headline: "Oil Prices Tumble as OPEC+ Fails to Reach Production Agreement",
    source: "CNBC",
    time: "32m ago",
    sentiment: "bearish",
    tickers: ["XLE", "USO", "CL"],
  },
  {
    id: "4",
    headline: "Bitcoin Breaks $105K Resistance, Analysts Eye $120K Target",
    source: "CoinDesk",
    time: "1h ago",
    sentiment: "bullish",
    tickers: ["BTC", "MSTR", "COIN"],
  },
  {
    id: "5",
    headline: "China Manufacturing PMI Beats Expectations, Yuan Strengthens",
    source: "FT",
    time: "2h ago",
    sentiment: "neutral",
    tickers: ["FXI", "EEM", "USD/CNY"],
  },
];

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "bullish":
      return <TrendingUp className="w-3.5 h-3.5 text-bullish" />;
    case "bearish":
      return <TrendingDown className="w-3.5 h-3.5 text-bearish" />;
    default:
      return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const getSentimentClass = (sentiment: string) => {
  switch (sentiment) {
    case "bullish":
      return "border-l-bullish bg-bullish/5";
    case "bearish":
      return "border-l-bearish bg-bearish/5";
    default:
      return "border-l-muted-foreground bg-muted/20";
  }
};

const MarketNews = () => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide">MARKET MOVING NEWS</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {newsItems.map((news) => (
          <div
            key={news.id}
            className={`group p-3 rounded-lg border-l-2 ${getSentimentClass(news.sentiment)} 
                       hover:bg-primary/5 transition-all cursor-pointer`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{getSentimentIcon(news.sentiment)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {news.headline}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted-foreground">{news.source}</span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground font-mono">{news.time}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {news.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium 
                                 bg-secondary/50 text-foreground/70 hover:bg-primary/20 
                                 hover:text-primary transition-colors cursor-pointer"
                    >
                      ${ticker}
                    </span>
                  ))}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketNews;
