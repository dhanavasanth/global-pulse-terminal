import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Gem, ChevronDown, ChevronUp, Search, Star } from "lucide-react";
import { useChart } from "@/contexts/ChartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface Commodity {
  symbol: string;
  tvSymbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
}

const initialCommodities: Commodity[] = [
  // Precious Metals
  { symbol: "XAU", tvSymbol: "TVC:GOLD", name: "Gold", price: 2685.40, change: 1.15, unit: "/oz" },
  { symbol: "XAG", tvSymbol: "TVC:SILVER", name: "Silver", price: 31.25, change: 0.92, unit: "/oz" },
  { symbol: "PL", tvSymbol: "TVC:PLATINUM", name: "Platinum", price: 985.20, change: -0.32, unit: "/oz" },
  { symbol: "PA", tvSymbol: "TVC:PALLADIUM", name: "Palladium", price: 1025.40, change: 0.78, unit: "/oz" },
  // Energy
  { symbol: "WTI", tvSymbol: "TVC:USOIL", name: "Crude Oil", price: 78.45, change: -0.65, unit: "/bbl" },
  { symbol: "BRENT", tvSymbol: "TVC:UKOIL", name: "Brent Oil", price: 82.35, change: -0.42, unit: "/bbl" },
  { symbol: "NG", tvSymbol: "TVC:NATURALGAS", name: "Natural Gas", price: 3.42, change: 1.85, unit: "/MMBtu" },
  // Industrial Metals
  { symbol: "HG", tvSymbol: "COMEX:HG1!", name: "Copper", price: 4.28, change: 0.45, unit: "/lb" },
  // Agricultural
  { symbol: "WHEAT", tvSymbol: "CBOT:ZW1!", name: "Wheat", price: 545.25, change: 1.25, unit: "/bu" },
  { symbol: "CORN", tvSymbol: "CBOT:ZC1!", name: "Corn", price: 458.75, change: -0.55, unit: "/bu" },
  { symbol: "COFFEE", tvSymbol: "ICEUS:KC1!", name: "Coffee", price: 185.45, change: 2.35, unit: "/lb" },
  { symbol: "COTTON", tvSymbol: "ICEUS:CT1!", name: "Cotton", price: 72.85, change: -0.28, unit: "/lb" },
];

const VISIBLE_COUNT = 5;

const CommoditiesPanel = () => {
  const [commodities, setCommodities] = useState(initialCommodities);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();
  const { isFavorite, toggleFavorite } = useFavorites();

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

  const displayedCommodities = useMemo(() => {
    let filtered = commodities;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = commodities.filter(c =>
        c.symbol.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
      );
    } else if (isExpanded) {
      filtered = [...commodities].sort((a, b) => {
        const aFav = isFavorite(a.tvSymbol) ? -1 : 0;
        const bFav = isFavorite(b.tvSymbol) ? -1 : 0;
        return aFav - bFav;
      });
    }

    if (!isExpanded && !searchQuery.trim()) {
      return filtered.slice(0, VISIBLE_COUNT);
    }

    return filtered;
  }, [commodities, isExpanded, searchQuery, isFavorite]);

  const hiddenCount = commodities.length - VISIBLE_COUNT;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="w-5 h-5 text-session-london" />
        <h2 className="text-sm font-semibold tracking-wide">COMMODITIES</h2>
      </div>

      {/* Search bar - visible when expanded */}
      {isExpanded && (
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search commodities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-lg text-sm 
                       placeholder:text-muted-foreground focus:outline-none focus:border-session-london/50 transition-colors"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {displayedCommodities.map((commodity) => {
          const isPositive = commodity.change >= 0;
          const isSelected = selectedSymbol === commodity.tvSymbol;
          const isFav = isFavorite(commodity.tvSymbol);

          return (
            <div
              key={commodity.symbol}
              onClick={() => handleSelectCommodity(commodity)}
              className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300
                         border ${isSelected
                  ? 'border-session-london bg-session-london/10 shadow-lg shadow-session-london/20'
                  : 'border-border/50 bg-secondary/20 hover:border-session-london/40 hover:bg-secondary/40'}`}
            >
              {/* Favorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(commodity.tvSymbol); }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-all
                           ${isFav ? 'text-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-400/70'}`}
              >
                <Star className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
              </button>

              <div className="flex items-center justify-between mb-1.5 pr-5">
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

      {/* Expand/Collapse button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground 
                     hover:text-foreground hover:bg-secondary/30 rounded-lg transition-all border border-border/30"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show More ({hiddenCount} more)
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CommoditiesPanel;
