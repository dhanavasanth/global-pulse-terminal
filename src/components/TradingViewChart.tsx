import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
  theme?: "dark" | "light";
  height?: number;
}

const TradingViewChart = ({ 
  symbol = "NASDAQ:AAPL", 
  theme = "dark",
  height = 400 
}: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      symbol: symbol,
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
  }, [symbol, theme]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wide">ADVANCED CHART</h2>
        <span className="text-xs text-muted-foreground font-mono">{symbol}</span>
      </div>
      <div 
        ref={containerRef} 
        className="tradingview-widget-container rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default TradingViewChart;
