import { useEffect, useRef } from "react";
import { useChart } from "@/contexts/ChartContext";
import { LineChart, Maximize2 } from "lucide-react";

interface TradingViewChartProps {
  theme?: "dark" | "light";
  height?: number;
}

const TradingViewChart = ({ 
  theme = "dark",
  height = 550 
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedSymbol, symbolName } = useChart();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: selectedSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(10, 15, 28, 1)",
      gridColor: "rgba(30, 40, 60, 0.5)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      withdateranges: true,
      details: true,
      hotlist: true,
      studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
    });

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedSymbol, theme]);

  return (
    <div className="glass-card p-4 lg:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide">ADVANCED CHART</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {symbolName} • <span className="font-mono text-primary">{selectedSymbol}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
            <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
            <span className="text-xs text-bullish font-mono">LIVE</span>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3">
        Click any tile from Indices, Forex, Crypto, or Commodities to view its chart
      </div>
      
      <div 
        ref={containerRef} 
        className="tradingview-widget-container rounded-xl overflow-hidden border border-border/50"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default TradingViewChart;
