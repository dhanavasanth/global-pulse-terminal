import { TrendingUp, TrendingDown, BarChart3, Zap, ChevronDown, ChevronUp, Search, Star } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useChart } from "@/contexts/ChartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAngelOneAuth } from "@/contexts/AngelOneAuthContext";
import { getIndianIndicesQuote, hasCredentials } from "@/lib/angelone";
import { COMMON_TOKENS } from "@/lib/angelone/types";

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
  // Indian Indices
  { symbol: "NIFTY", tvSymbol: "NSE:NIFTY", name: "NIFTY 50", exchange: "NSE", price: 24850.75, change: 156.30, changePercent: 0.63, high: 24920.00, low: 24680.50, open: 24694.45, volume: "245M" },
  { symbol: "SENSEX", tvSymbol: "BSE:SENSEX", name: "SENSEX", exchange: "BSE", price: 81520.40, change: 485.20, changePercent: 0.60, high: 81680.00, low: 81050.00, open: 81035.20, volume: "128M" },
  { symbol: "BANKNIFTY", tvSymbol: "NSE:BANKNIFTY", name: "BANK NIFTY", exchange: "NSE", price: 53240.85, change: -124.50, changePercent: -0.23, high: 53480.00, low: 53100.00, open: 53365.35, volume: "89M" },
  // US Indices
  { symbol: "SPX", tvSymbol: "SP:SPX", name: "S&P 500", exchange: "NYSE", price: 5985.25, change: 42.80, changePercent: 0.72, high: 5998.50, low: 5942.30, open: 5942.45, volume: "3.2B" },
  { symbol: "NDX", tvSymbol: "NASDAQ:NDX", name: "NASDAQ 100", exchange: "NASDAQ", price: 21245.60, change: 185.40, changePercent: 0.88, high: 21320.00, low: 21060.00, open: 21060.20, volume: "1.8B" },
  { symbol: "DJI", tvSymbol: "DJ:DJI", name: "DOW JONES", exchange: "NYSE", price: 44285.30, change: 312.50, changePercent: 0.71, high: 44350.00, low: 43972.80, open: 43972.80, volume: "890M" },
  { symbol: "VIX", tvSymbol: "TVC:VIX", name: "VOLATILITY", exchange: "CBOE", price: 14.25, change: -0.85, changePercent: -5.63, high: 15.10, low: 14.05, open: 15.10, volume: "42M" },
  // European Indices
  { symbol: "FTSE", tvSymbol: "TVC:UKX", name: "FTSE 100", exchange: "LSE", price: 8415.25, change: 45.80, changePercent: 0.55, high: 8445.00, low: 8369.50, open: 8369.45, volume: "680M" },
  { symbol: "DAX", tvSymbol: "XETR:DAX", name: "DAX 40", exchange: "XETRA", price: 21245.80, change: 128.40, changePercent: 0.61, high: 21320.00, low: 21117.40, open: 21117.40, volume: "520M" },
  { symbol: "CAC", tvSymbol: "TVC:CAC40", name: "CAC 40", exchange: "EURONEXT", price: 7925.60, change: 52.30, changePercent: 0.66, high: 7968.00, low: 7873.30, open: 7873.30, volume: "380M" },
  // Asian Indices
  { symbol: "N225", tvSymbol: "TVC:NI225", name: "NIKKEI 225", exchange: "JPX", price: 38945.20, change: -156.80, changePercent: -0.40, high: 39180.00, low: 38820.00, open: 39102.00, volume: "1.2B" },
  { symbol: "HSI", tvSymbol: "TVC:HSI", name: "HANG SENG", exchange: "HKEX", price: 19875.40, change: 234.60, changePercent: 1.19, high: 19920.00, low: 19640.80, open: 19640.80, volume: "2.1B" },
  { symbol: "SSEC", tvSymbol: "SSE:000001", name: "SHANGHAI", exchange: "SSE", price: 3245.80, change: 28.40, changePercent: 0.88, high: 3268.00, low: 3217.40, open: 3217.40, volume: "4.2B" },
  { symbol: "KOSPI", tvSymbol: "KRX:KOSPI", name: "KOSPI", exchange: "KRX", price: 2485.60, change: -18.30, changePercent: -0.73, high: 2512.00, low: 2478.30, open: 2503.90, volume: "890M" },
  // Other Indices
  { symbol: "ASX", tvSymbol: "TVC:XJO", name: "ASX 200", exchange: "ASX", price: 8425.40, change: 35.60, changePercent: 0.42, high: 8452.00, low: 8389.80, open: 8389.80, volume: "450M" },
  { symbol: "TSX", tvSymbol: "TSX:TSX", name: "TSX COMP", exchange: "TSX", price: 25124.80, change: 145.20, changePercent: 0.58, high: 25180.00, low: 24979.60, open: 24979.60, volume: "320M" },
];

const VISIBLE_COUNT = 5;

const IndicesBoard = () => {
  const [indices, setIndices] = useState(initialIndices);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isLoggedIn } = useAngelOneAuth(); // Use Auth Context

  // Fetch live Indian indices data
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchIndices = async () => {
      try {
        const data = await getIndianIndicesQuote();

        setIndices(prev => prev.map(index => {
          // Check if this index corresponds to an Angel One token
          const tokenEntry = Object.values(COMMON_TOKENS).find(t =>
            t.tradingsymbol === index.name ||
            (index.symbol === 'NIFTY' && t.tradingsymbol === 'NIFTY 50') ||
            (index.symbol === 'SENSEX' && t.tradingsymbol === 'SENSEX') ||
            (index.symbol === 'BANKNIFTY' && t.tradingsymbol === 'NIFTY BANK')
          );

          if (tokenEntry && data.has(tokenEntry.symboltoken)) {
            const quote = data.get(tokenEntry.symboltoken)!;

            // Format volume
            const vol = quote.volume >= 10000000
              ? `${(quote.volume / 10000000).toFixed(1)}Cr`
              : quote.volume >= 100000
                ? `${(quote.volume / 100000).toFixed(1)}L`
                : quote.volume.toString();

            return {
              ...index,
              price: quote.ltp,
              change: quote.ltp - quote.close,
              changePercent: quote.percentChange,
              high: quote.high,
              low: quote.low,
              open: quote.open,
              volume: vol,
            };
          }
          return index;
        }));
      } catch (err) {
        console.error("Failed to update indices:", err);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Simulated data updates for NON-Indian indices
  useEffect(() => {
    const interval = setInterval(() => {
      setIndices(prev => prev.map(index => {
        // Skip Indian indices if connected
        if (isLoggedIn && ['NIFTY', 'SENSEX', 'BANKNIFTY'].includes(index.symbol)) {
          return index;
        }

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
  }, [isLoggedIn]);

  const handleSelectIndex = (index: Index) => {
    setSelectedSymbol(index.tvSymbol);
    setSymbolName(index.name);
  };

  const displayedIndices = useMemo(() => {
    let filtered = indices;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = indices.filter(i =>
        i.symbol.toLowerCase().includes(query) ||
        i.name.toLowerCase().includes(query) ||
        i.exchange.toLowerCase().includes(query)
      );
    } else if (isExpanded) {
      // Sort favorites first when expanded
      filtered = [...indices].sort((a, b) => {
        const aFav = isFavorite(a.tvSymbol) ? -1 : 0;
        const bFav = isFavorite(b.tvSymbol) ? -1 : 0;
        return aFav - bFav;
      });
    }

    if (!isExpanded && !searchQuery.trim()) {
      return filtered.slice(0, VISIBLE_COUNT);
    }

    return filtered;
  }, [indices, isExpanded, searchQuery, isFavorite]);

  const hiddenCount = indices.length - VISIBLE_COUNT;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide">GLOBAL INDICES</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-bullish" />
            <span className="text-xs text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>
      </div>

      {/* Search bar - visible when expanded */}
      {isExpanded && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search indices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-lg text-sm 
                       placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
        {displayedIndices.map((index) => {
          const isPositive = index.change >= 0;
          const isSelected = selectedSymbol === index.tvSymbol;
          const isFav = isFavorite(index.tvSymbol);

          return (
            <div
              key={index.symbol}
              onClick={() => handleSelectIndex(index)}
              className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 group
                         border ${isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40'}`}
            >
              {/* Favorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(index.tvSymbol); }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-all
                           ${isFav ? 'text-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-400/70'}`}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-2 pr-5">
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

      {/* Expand/Collapse button */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground 
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

export default IndicesBoard;
