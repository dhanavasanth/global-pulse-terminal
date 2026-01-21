import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Gem } from "lucide-react";
import { useChart } from "@/contexts/ChartContext";

interface Commodity {
  symbol: string;
  tvSymbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
}

const initialCommodities: Commodity[] = [
  { symbol: "XAU", tvSymbol: "TVC:GOLD", name: "Gold", price: 2685.40, change: 1.15, unit: "/oz" },
  { symbol: "XAG", tvSymbol: "TVC:SILVER", name: "Silver", price: 31.25, change: 0.92, unit: "/oz" },
  { symbol: "WTI", tvSymbol: "TVC:USOIL", name: "Crude Oil", price: 78.45, change: -0.65, unit: "/bbl" },
  { symbol: "NG", tvSymbol: "TVC:NATURALGAS", name: "Natural Gas", price: 3.42, change: 1.85, unit: "/MMBtu" },
  { symbol: "HG", tvSymbol: "COMEX:HG1!", name: "Copper", price: 4.28, change: 0.45, unit: "/lb" },
  { symbol: "PL", tvSymbol: "TVC:PLATINUM", name: "Platinum", price: 985.20, change: -0.32, unit: "/oz" },
];

const CommoditiesPanel = () => {
  const [commodities, setCommodities] = useState(initialCommodities);
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();

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

  const handleSelectCommodity = (commodity: Commodity) => {
    setSelectedSymbol(commodity.tvSymbol);
    setSymbolName(commodity.name);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="w-5 h-5 text-session-london" />
        <h2 className="text-sm font-semibold tracking-wide">COMMODITIES</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {commodities.map((commodity) => {
          const isPositive = commodity.change >= 0;
          const isSelected = selectedSymbol === commodity.tvSymbol;
          
          return (
            <div 
              key={commodity.symbol}
              onClick={() => handleSelectCommodity(commodity)}
              className={`p-3 rounded-xl cursor-pointer transition-all duration-300
                         border ${isSelected 
                           ? 'border-session-london bg-session-london/10 shadow-lg shadow-session-london/20' 
                           : 'border-border/50 bg-secondary/20 hover:border-session-london/40 hover:bg-secondary/40'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold">{commodity.symbol}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.5 rounded
                               ${isPositive ? 'text-bullish bg-bullish/10' : 'text-bearish bg-bearish/10'}`}>
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isPositive ? '+' : ''}{commodity.change.toFixed(2)}%
                </span>
              </div>
              
              <p className="text-[10px] text-muted-foreground mb-1">{commodity.name}</p>
              
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-sm font-semibold">
                  ${commodity.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-muted-foreground">{commodity.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommoditiesPanel;
