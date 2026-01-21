import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useChart } from "@/contexts/ChartContext";

interface ForexPair {
  symbol: string;
  tvSymbol: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  high: number;
  low: number;
}

const initialPairs: ForexPair[] = [
  { symbol: "EUR/USD", tvSymbol: "FX:EURUSD", bid: 1.0842, ask: 1.0845, spread: 0.3, change: 0.12, high: 1.0878, low: 1.0812 },
  { symbol: "GBP/USD", tvSymbol: "FX:GBPUSD", bid: 1.2651, ask: 1.2654, spread: 0.3, change: -0.08, high: 1.2698, low: 1.2615 },
  { symbol: "USD/JPY", tvSymbol: "FX:USDJPY", bid: 157.79, ask: 157.82, spread: 0.3, change: 0.24, high: 158.12, low: 157.25 },
  { symbol: "USD/CHF", tvSymbol: "FX:USDCHF", bid: 0.9012, ask: 0.9015, spread: 0.3, change: -0.15, high: 0.9045, low: 0.8985 },
  { symbol: "AUD/USD", tvSymbol: "FX:AUDUSD", bid: 0.6242, ask: 0.6245, spread: 0.3, change: -0.22, high: 0.6278, low: 0.6218 },
  { symbol: "USD/CAD", tvSymbol: "FX:USDCAD", bid: 1.4385, ask: 1.4388, spread: 0.3, change: 0.18, high: 1.4412, low: 1.4352 },
];

const ForexPanel = () => {
  const [pairs, setPairs] = useState(initialPairs);
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();

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

  const handleSelectPair = (pair: ForexPair) => {
    setSelectedSymbol(pair.tvSymbol);
    setSymbolName(pair.symbol);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide">FOREX MAJORS</h2>
      </div>

      <div className="space-y-2">
        {pairs.map((pair) => {
          const isPositive = pair.change >= 0;
          const isSelected = selectedSymbol === pair.tvSymbol;
          
          return (
            <div 
              key={pair.symbol}
              onClick={() => handleSelectPair(pair)}
              className={`p-3 rounded-xl cursor-pointer transition-all duration-300
                         border ${isSelected 
                           ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                           : 'border-border/50 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-10 rounded-full ${isPositive ? 'bg-bullish' : 'bg-bearish'}`} />
                  <div>
                    <p className="font-semibold text-sm">{pair.symbol}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Spread: {pair.spread} pips
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-semibold">{pair.bid.toFixed(4)}</span>
                    <span className="text-[10px] text-muted-foreground">/ {pair.ask.toFixed(4)}</span>
                  </div>
                  <div className={`flex items-center justify-end gap-1 text-xs font-mono
                                 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                  </div>
                </div>
              </div>
              
              {/* Mini range indicator */}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono">L: {pair.low.toFixed(4)}</span>
                <div className="flex-1 h-0.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isPositive ? 'bg-bullish/50' : 'bg-bearish/50'}`}
                    style={{ 
                      width: `${((pair.bid - pair.low) / (pair.high - pair.low)) * 100}%` 
                    }}
                  />
                </div>
                <span className="font-mono">H: {pair.high.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForexPanel;
