import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Gem } from "lucide-react";

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
}

const initialCommodities: Commodity[] = [
  { symbol: "XAU", name: "Gold", price: 2685.40, change: 1.15, unit: "/oz" },
  { symbol: "XAG", name: "Silver", price: 31.25, change: 0.92, unit: "/oz" },
  { symbol: "WTI", name: "Crude Oil", price: 78.45, change: -0.65, unit: "/bbl" },
  { symbol: "NG", name: "Natural Gas", price: 3.42, change: 1.85, unit: "/MMBtu" },
  { symbol: "HG", name: "Copper", price: 4.28, change: 0.45, unit: "/lb" },
  { symbol: "PL", name: "Platinum", price: 985.20, change: -0.32, unit: "/oz" },
];

const CommoditiesPanel = () => {
  const [commodities, setCommodities] = useState(initialCommodities);

  useEffect(() => {
    const interval = setInterval(() => {
      setCommodities(prev => prev.map(commodity => {
        const randomChange = (Math.random() - 0.5) * (commodity.price * 0.001);
        
        return {
          ...commodity,
          price: Math.round((commodity.price + randomChange) * 100) / 100,
          change: Math.round((commodity.change + (Math.random() - 0.5) * 0.1) * 100) / 100,
        };
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="w-5 h-5 text-session-london" />
        <h2 className="text-sm font-semibold tracking-wide">COMMODITIES</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {commodities.map((commodity) => {
          const isPositive = commodity.change >= 0;
          
          return (
            <div 
              key={commodity.symbol} 
              className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-session-london/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{commodity.symbol}</span>
                <span className={`flex items-center gap-0.5 text-xs font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{commodity.change.toFixed(2)}%
                </span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">{commodity.name}</p>
              
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-lg font-semibold">
                  ${commodity.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-muted-foreground">{commodity.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommoditiesPanel;
