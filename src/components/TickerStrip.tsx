import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  category: "forex" | "crypto" | "commodity";
}

const initialTickers: TickerItem[] = [
  { symbol: "EUR/USD", price: 1.0845, change: 0.12, category: "forex" },
  { symbol: "GBP/USD", price: 1.2654, change: -0.08, category: "forex" },
  { symbol: "USD/JPY", price: 157.82, change: 0.24, category: "forex" },
  { symbol: "XAU/USD", price: 2685.40, change: 1.15, category: "commodity" },
  { symbol: "BTC/USD", price: 104250, change: 2.45, category: "crypto" },
  { symbol: "ETH/USD", price: 3845, change: 1.82, category: "crypto" },
  { symbol: "CRUDE", price: 78.45, change: -0.65, category: "commodity" },
  { symbol: "SILVER", price: 31.25, change: 0.92, category: "commodity" },
  { symbol: "USD/INR", price: 85.42, change: 0.05, category: "forex" },
  { symbol: "SOL/USD", price: 218.50, change: 4.25, category: "crypto" },
  { symbol: "AUD/USD", price: 0.6245, change: -0.15, category: "forex" },
  { symbol: "NATURAL GAS", price: 3.42, change: 1.85, category: "commodity" },
];

const TickerStrip = () => {
  const [tickers, setTickers] = useState(initialTickers);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(ticker => {
        const randomChange = (Math.random() - 0.5) * 0.1;
        const multiplier = ticker.category === "crypto" ? 100 : 
                          ticker.category === "commodity" ? 1 : 0.001;
        
        return {
          ...ticker,
          price: Math.round((ticker.price + randomChange * multiplier) * 100) / 100,
          change: Math.round((ticker.change + (Math.random() - 0.5) * 0.1) * 100) / 100,
        };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const duplicatedTickers = [...tickers, ...tickers];

  return (
    <div className="overflow-hidden bg-secondary/30 border-y border-border py-2">
      <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap">
        {duplicatedTickers.map((ticker, idx) => {
          const isPositive = ticker.change >= 0;
          
          return (
            <div key={`${ticker.symbol}-${idx}`} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {ticker.symbol}
              </span>
              <span className="font-mono text-sm font-medium">
                {ticker.price.toLocaleString('en-US', { 
                  minimumFractionDigits: ticker.category === "crypto" ? 0 : 2,
                  maximumFractionDigits: ticker.category === "forex" ? 4 : 2
                })}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}{ticker.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TickerStrip;
