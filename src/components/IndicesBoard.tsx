import { TrendingUp, TrendingDown, BarChart3, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useChart } from "@/contexts/ChartContext";

interface Index {
  symbol: string;
  tvSymbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  volume: string;
}

const initialIndices: Index[] = [
  { symbol: "NIFTY", tvSymbol: "NSE:NIFTY", name: "NIFTY 50", exchange: "NSE", price: 24850.75, change: 156.30, changePercent: 0.63, high: 24920.00, low: 24680.50, open: 24694.45, volume: "245M" },
  { symbol: "SENSEX", tvSymbol: "BSE:SENSEX", name: "SENSEX", exchange: "BSE", price: 81520.40, change: 485.20, changePercent: 0.60, high: 81680.00, low: 81050.00, open: 81035.20, volume: "128M" },
  { symbol: "BANKNIFTY", tvSymbol: "NSE:BANKNIFTY", name: "BANK NIFTY", exchange: "NSE", price: 53240.85, change: -124.50, changePercent: -0.23, high: 53480.00, low: 53100.00, open: 53365.35, volume: "89M" },
  { symbol: "SPX", tvSymbol: "SP:SPX", name: "S&P 500", exchange: "NYSE", price: 5985.25, change: 42.80, changePercent: 0.72, high: 5998.50, low: 5942.30, open: 5942.45, volume: "3.2B" },
  { symbol: "NDX", tvSymbol: "NASDAQ:NDX", name: "NASDAQ 100", exchange: "NASDAQ", price: 21245.60, change: 185.40, changePercent: 0.88, high: 21320.00, low: 21060.00, open: 21060.20, volume: "1.8B" },
  { symbol: "DJI", tvSymbol: "DJ:DJI", name: "DOW JONES", exchange: "NYSE", price: 44285.30, change: 312.50, changePercent: 0.71, high: 44350.00, low: 43972.80, open: 43972.80, volume: "890M" },
  { symbol: "N225", tvSymbol: "TVC:NI225", name: "NIKKEI 225", exchange: "JPX", price: 38945.20, change: -156.80, changePercent: -0.40, high: 39180.00, low: 38820.00, open: 39102.00, volume: "1.2B" },
  { symbol: "HSI", tvSymbol: "TVC:HSI", name: "HANG SENG", exchange: "HKEX", price: 19875.40, change: 234.60, changePercent: 1.19, high: 19920.00, low: 19640.80, open: 19640.80, volume: "2.1B" },
];

const IndicesBoard = () => {
  const [indices, setIndices] = useState(initialIndices);
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(prev => prev.map(index => {
        const randomChange = (Math.random() - 0.5) * 10;
        const newPrice = index.price + randomChange;
        const newChange = index.change + randomChange;
        const newChangePercent = (newChange / (newPrice - newChange)) * 100;
        
        return {
          ...index,
          price: Math.round(newPrice * 100) / 100,
          change: Math.round(newChange * 100) / 100,
          changePercent: Math.round(newChangePercent * 100) / 100,
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectIndex = (index: Index) => {
    setSelectedSymbol(index.tvSymbol);
    setSymbolName(index.name);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide">GLOBAL INDICES</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-bullish" />
          <span className="text-xs text-muted-foreground font-mono">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map((index) => {
          const isPositive = index.change >= 0;
          const isSelected = selectedSymbol === index.tvSymbol;
          
          return (
            <div
              key={index.symbol}
              onClick={() => handleSelectIndex(index)}
              className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 group
                         border ${isSelected 
                           ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                           : 'border-border/50 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40'}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
              )}
              
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-6 rounded-full ${isPositive ? 'bg-bullish' : 'bg-bearish'}`} />
                  <div>
                    <p className="font-bold text-sm">{index.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{index.exchange}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono
                               ${isPositive ? 'bg-bullish/15 text-bullish' : 'bg-bearish/15 text-bearish'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </div>
              </div>
              
              {/* Price */}
              <div className="mb-2">
                <p className="font-mono text-lg font-semibold">
                  {index.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)}
                </p>
              </div>
              
              {/* Range bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>L: {index.low.toLocaleString()}</span>
                  <span>H: {index.high.toLocaleString()}</span>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${isPositive ? 'bg-bullish' : 'bg-bearish'}`}
                    style={{ 
                      width: `${((index.price - index.low) / (index.high - index.low)) * 100}%` 
                    }}
                  />
                </div>
              </div>
              
              {/* Volume */}
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground">
                  Vol: <span className="font-mono text-foreground/70">{index.volume}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndicesBoard;
