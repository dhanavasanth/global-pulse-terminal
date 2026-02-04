import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Bitcoin, ChevronDown, ChevronUp, Search, Star } from "lucide-react";
import { useChart } from "@/contexts/ChartContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface Crypto {
  symbol: string;
  tvSymbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
}

const initialCryptos: Crypto[] = [
  // Top Cryptocurrencies
  { symbol: "BTC", tvSymbol: "BINANCE:BTCUSDT", name: "Bitcoin", price: 104250, change24h: 2.45, volume: "$48.2B", marketCap: "$2.05T" },
  { symbol: "ETH", tvSymbol: "BINANCE:ETHUSDT", name: "Ethereum", price: 3845, change24h: 1.82, volume: "$18.5B", marketCap: "$462B" },
  { symbol: "SOL", tvSymbol: "BINANCE:SOLUSDT", name: "Solana", price: 218.50, change24h: 4.25, volume: "$4.2B", marketCap: "$102B" },
  { symbol: "XRP", tvSymbol: "BINANCE:XRPUSDT", name: "Ripple", price: 2.45, change24h: -1.15, volume: "$8.5B", marketCap: "$140B" },
  { symbol: "BNB", tvSymbol: "BINANCE:BNBUSDT", name: "BNB", price: 712.80, change24h: 0.85, volume: "$2.1B", marketCap: "$106B" },
  { symbol: "ADA", tvSymbol: "BINANCE:ADAUSDT", name: "Cardano", price: 1.12, change24h: 3.20, volume: "$1.8B", marketCap: "$39B" },
  // Alt Coins
  { symbol: "DOGE", tvSymbol: "BINANCE:DOGEUSDT", name: "Dogecoin", price: 0.385, change24h: 5.82, volume: "$3.8B", marketCap: "$56B" },
  { symbol: "AVAX", tvSymbol: "BINANCE:AVAXUSDT", name: "Avalanche", price: 38.25, change24h: 2.15, volume: "$980M", marketCap: "$15.2B" },
  { symbol: "LINK", tvSymbol: "BINANCE:LINKUSDT", name: "Chainlink", price: 22.85, change24h: 1.45, volume: "$1.2B", marketCap: "$14.5B" },
  { symbol: "DOT", tvSymbol: "BINANCE:DOTUSDT", name: "Polkadot", price: 7.25, change24h: -0.85, volume: "$520M", marketCap: "$10.8B" },
  { symbol: "MATIC", tvSymbol: "BINANCE:MATICUSDT", name: "Polygon", price: 0.485, change24h: 1.92, volume: "$380M", marketCap: "$4.8B" },
  { symbol: "ATOM", tvSymbol: "BINANCE:ATOMUSDT", name: "Cosmos", price: 9.85, change24h: 3.45, volume: "$420M", marketCap: "$3.8B" },
];

const VISIBLE_COUNT = 5;

const CryptoPanel = () => {
  const [cryptos, setCryptos] = useState(initialCryptos);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedSymbol, setSelectedSymbol, setSymbolName } = useChart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const interval = setInterval(() => {
      setCryptos(prev => prev.map(crypto => {
        const volatility = crypto.symbol === "BTC" ? 50 : crypto.symbol === "ETH" ? 20 : 5;
        const randomChange = (Math.random() - 0.5) * volatility;

        return {
          ...crypto,
          price: Math.round((crypto.price + randomChange) * 100) / 100,
          change24h: Math.round((crypto.change24h + (Math.random() - 0.5) * 0.2) * 100) / 100,
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectCrypto = (crypto: Crypto) => {
    setSelectedSymbol(crypto.tvSymbol);
    setSymbolName(`${crypto.name} (${crypto.symbol})`);
  };

  const displayedCryptos = useMemo(() => {
    let filtered = cryptos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = cryptos.filter(c =>
        c.symbol.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
      );
    } else if (isExpanded) {
      filtered = [...cryptos].sort((a, b) => {
        const aFav = isFavorite(a.tvSymbol) ? -1 : 0;
        const bFav = isFavorite(b.tvSymbol) ? -1 : 0;
        return aFav - bFav;
      });
    }

    if (!isExpanded && !searchQuery.trim()) {
      return filtered.slice(0, VISIBLE_COUNT);
    }

    return filtered;
  }, [cryptos, isExpanded, searchQuery, isFavorite]);

  const hiddenCount = cryptos.length - VISIBLE_COUNT;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bitcoin className="w-5 h-5 text-warning" />
        <h2 className="text-sm font-semibold tracking-wide">CRYPTOCURRENCY</h2>
      </div>

      {/* Search bar - visible when expanded */}
      {isExpanded && (
        <div className="mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search crypto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-lg text-sm 
                       placeholder:text-muted-foreground focus:outline-none focus:border-warning/50 transition-colors"
          />
        </div>
      )}

      <div className="space-y-2">
        {displayedCryptos.map((crypto) => {
          const isPositive = crypto.change24h >= 0;
          const isSelected = selectedSymbol === crypto.tvSymbol;
          const isFav = isFavorite(crypto.tvSymbol);

          return (
            <div
              key={crypto.symbol}
              onClick={() => handleSelectCrypto(crypto)}
              className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300
                         border ${isSelected
                  ? 'border-warning bg-warning/10 shadow-lg shadow-warning/20'
                  : 'border-border/50 bg-secondary/20 hover:border-warning/40 hover:bg-secondary/40'}`}
            >
              {/* Favorite button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(crypto.tvSymbol); }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-all
                           ${isFav ? 'text-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-400/70'}`}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>

              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                                 ${isSelected ? 'bg-warning/30' : 'bg-warning/15'}`}>
                    <span className="text-xs font-bold text-warning">{crypto.symbol.slice(0, 3)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{crypto.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{crypto.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-semibold">
                    ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center justify-end gap-1 text-xs font-mono
                                 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Extra info row */}
              <div className="mt-2 pt-2 border-t border-border/30 flex justify-between text-[10px] text-muted-foreground">
                <span>Vol: <span className="font-mono text-foreground/70">{crypto.volume}</span></span>
                <span>MCap: <span className="font-mono text-foreground/70">{crypto.marketCap}</span></span>
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

export default CryptoPanel;
