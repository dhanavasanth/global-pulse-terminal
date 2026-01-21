import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react";

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
}

const initialCryptos: Crypto[] = [
  { symbol: "BTC", name: "Bitcoin", price: 104250, change24h: 2.45, volume: "$48.2B", marketCap: "$2.05T" },
  { symbol: "ETH", name: "Ethereum", price: 3845, change24h: 1.82, volume: "$18.5B", marketCap: "$462B" },
  { symbol: "SOL", name: "Solana", price: 218.50, change24h: 4.25, volume: "$4.2B", marketCap: "$102B" },
  { symbol: "XRP", name: "Ripple", price: 2.45, change24h: -1.15, volume: "$8.5B", marketCap: "$140B" },
  { symbol: "BNB", name: "BNB", price: 712.80, change24h: 0.85, volume: "$2.1B", marketCap: "$106B" },
  { symbol: "ADA", name: "Cardano", price: 1.12, change24h: 3.20, volume: "$1.8B", marketCap: "$39B" },
];

const CryptoPanel = () => {
  const [cryptos, setCryptos] = useState(initialCryptos);

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

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bitcoin className="w-5 h-5 text-warning" />
        <h2 className="text-sm font-semibold tracking-wide">CRYPTOCURRENCY</h2>
      </div>

      <div className="space-y-2">
        {cryptos.map((crypto) => {
          const isPositive = crypto.change24h >= 0;
          
          return (
            <div 
              key={crypto.symbol} 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-warning/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-warning">{crypto.symbol.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-medium text-sm">{crypto.symbol}</p>
                  <p className="text-xs text-muted-foreground">{crypto.name}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono font-semibold">
                  ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`flex items-center justify-end gap-1 text-xs font-mono ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoPanel;
