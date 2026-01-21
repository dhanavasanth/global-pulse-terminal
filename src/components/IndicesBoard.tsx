import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface Index {
  symbol: string;
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
  { symbol: "NIFTY", name: "NIFTY 50", exchange: "NSE", price: 24850.75, change: 156.30, changePercent: 0.63, high: 24920.00, low: 24680.50, open: 24694.45, volume: "245M" },
  { symbol: "SENSEX", name: "SENSEX", exchange: "BSE", price: 81520.40, change: 485.20, changePercent: 0.60, high: 81680.00, low: 81050.00, open: 81035.20, volume: "128M" },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", exchange: "NSE", price: 53240.85, change: -124.50, changePercent: -0.23, high: 53480.00, low: 53100.00, open: 53365.35, volume: "89M" },
  { symbol: "SPX", name: "S&P 500", exchange: "NYSE", price: 5985.25, change: 42.80, changePercent: 0.72, high: 5998.50, low: 5942.30, open: 5942.45, volume: "3.2B" },
  { symbol: "NDX", name: "NASDAQ 100", exchange: "NASDAQ", price: 21245.60, change: 185.40, changePercent: 0.88, high: 21320.00, low: 21060.00, open: 21060.20, volume: "1.8B" },
  { symbol: "DJI", name: "DOW JONES", exchange: "NYSE", price: 44285.30, change: 312.50, changePercent: 0.71, high: 44350.00, low: 43972.80, open: 43972.80, volume: "890M" },
  { symbol: "N225", name: "NIKKEI 225", exchange: "JPX", price: 38945.20, change: -156.80, changePercent: -0.40, high: 39180.00, low: 38820.00, open: 39102.00, volume: "1.2B" },
  { symbol: "HSI", name: "HANG SENG", exchange: "HKEX", price: 19875.40, change: 234.60, changePercent: 1.19, high: 19920.00, low: 19640.80, open: 19640.80, volume: "2.1B" },
];

const IndicesBoard = () => {
  const [indices, setIndices] = useState(initialIndices);

  // Simulate real-time updates
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

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide">GLOBAL INDICES</h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">LIVE</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Symbol</th>
              <th className="text-right pb-2 font-medium">Price</th>
              <th className="text-right pb-2 font-medium">Change</th>
              <th className="text-right pb-2 font-medium">%</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">High</th>
              <th className="text-right pb-2 font-medium hidden md:table-cell">Low</th>
              <th className="text-right pb-2 font-medium hidden lg:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {indices.map((index) => {
              const isPositive = index.change >= 0;
              
              return (
                <tr key={index.symbol} className="data-row border-b border-border/50">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${isPositive ? 'bg-bullish' : 'bg-bearish'}`} />
                      <div>
                        <p className="font-semibold">{index.symbol}</p>
                        <p className="text-xs text-muted-foreground">{index.exchange}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-2.5 font-mono font-medium">
                    {index.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right py-2.5 font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPositive ? '+' : ''}{index.change.toFixed(2)}
                    </div>
                  </td>
                  <td className={`text-right py-2.5 font-mono font-medium ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </td>
                  <td className="text-right py-2.5 font-mono text-muted-foreground hidden md:table-cell">
                    {index.high.toLocaleString()}
                  </td>
                  <td className="text-right py-2.5 font-mono text-muted-foreground hidden md:table-cell">
                    {index.low.toLocaleString()}
                  </td>
                  <td className="text-right py-2.5 font-mono text-muted-foreground hidden lg:table-cell">
                    {index.volume}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndicesBoard;
