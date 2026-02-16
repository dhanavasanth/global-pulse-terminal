/**
 * TradingView Economic Calendar Widget
 * Shows upcoming economic events and announcements
 */

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface TradingViewEconomicCalendarProps {
    colorTheme?: "dark" | "light";
    height?: number;
    isTransparent?: boolean;
}

const TradingViewEconomicCalendar = ({
    colorTheme = "dark",
    height = 400,
    isTransparent = false,
}: TradingViewEconomicCalendarProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !isExpanded) return;

        containerRef.current.innerHTML = "";

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            colorTheme,
            isTransparent,
            width: "100%",
            height: "100%",
            locale: "en",
            importanceFilter: "-1,0,1",
            countryFilter: "us,eu,gb,jp,in,cn",
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
    }, [colorTheme, isTransparent, isExpanded]);

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">ECONOMIC CALENDAR</h2>
                        <p className="text-xs text-muted-foreground">Upcoming events & announcements</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {isExpanded && (
                <div style={{ height: `${height}px` }} className="w-full">
                    <div
                        ref={containerRef}
                        className="tradingview-widget-container rounded-lg overflow-hidden border border-border/50"
                        style={{ height: "100%", width: "100%" }}
                    />
                </div>
            )}
        </div>
    );
};

export default TradingViewEconomicCalendar;
