import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface ForexPair {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  high: number;
  low: number;
}

const initialPairs: ForexPair[] = [
  { symbol: "EUR/USD", bid: 1.0842, ask: 1.0845, spread: 0.3, change: 0.12, high: 1.0878, low: 1.0812 },
  { symbol: "GBP/USD", bid: 1.2651, ask: 1.2654, spread: 0.3, change: -0.08, high: 1.2698, low: 1.2615 },
  { symbol: "USD/JPY", bid: 157.79, ask: 157.82, spread: 0.3, change: 0.24, high: 158.12, low: 157.25 },
  { symbol: "USD/CHF", bid: 0.9012, ask: 0.9015, spread: 0.3, change: -0.15, high: 0.9045, low: 0.8985 },
  { symbol: "AUD/USD", bid: 0.6242, ask: 0.6245, spread: 0.3, change: -0.22, high: 0.6278, low: 0.6218 },
  { symbol: "USD/CAD", bid: 1.4385, ask: 1.4388, spread: 0.3, change: 0.18, high: 1.4412, low: 1.4352 },
];

const ForexPanel = () => {
  const [pairs, setPairs] = useState(initialPairs);

  useEffect(() => {
    const interval = setInterval(() => {
      setPairs(prev => prev.map(pair => {
        const randomChange = (Math.random() - 0.5) * 0.002;
        const newBid = pair.bid + randomChange;
        const newAsk = newBid + pair.spread / 10000;
        
        return {
          ...pair,
          bid: Math.round(newBid * 10000) / 10000,
          ask: Math.round(newAsk * 10000) / 10000,
          change: Math.round((pair.change + (Math.random() - 0.5) * 0.05) * 100) / 100,
        };
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide">FOREX MAJORS</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {pairs.map((pair) => {
          const isPositive = pair.change >= 0;
          
          return (
            <div 
              key={pair.symbol} 
              className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{pair.symbol}</span>
                <span className={`flex items-center gap-0.5 text-xs font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-semibold">{pair.bid.toFixed(4)}</span>
                <span className="text-xs text-muted-foreground">/ {pair.ask.toFixed(4)}</span>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>H: {pair.high.toFixed(4)}</span>
                <span>L: {pair.low.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForexPanel;
