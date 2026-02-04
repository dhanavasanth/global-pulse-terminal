import { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

const TradingViewEarningsCalendar = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme: "dark",
            isTransparent: false,
            width: "100%",
            height: "100%",
            locale: "en",
            importanceFilter: "0,1",
            countryFilter: "us,eu,gb,jp,cn,in",
        });

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";

        containerRef.current.appendChild(widgetContainer);
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, []);

    return (
        <div className="glass-card p-4 lg:p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">ECONOMIC EVENTS</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Earnings & Economic Calendar
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                    <span className="text-xs text-bullish font-mono">LIVE</span>
                </div>
            </div>

            <div style={{ height: "350px" }} className="w-full">
                <div
                    ref={containerRef}
                    className="tradingview-widget-container rounded-xl overflow-hidden border border-border/50"
                    style={{ height: "100%", width: "100%" }}
                />
            </div>
        </div>
    );
};

export default TradingViewEarningsCalendar;
