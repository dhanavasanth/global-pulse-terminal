import { useState, useEffect } from "react";
import {
    Clock, Bell, TrendingUp, TrendingDown, BarChart3,
    DollarSign, Megaphone, AlertCircle, Calendar
} from "lucide-react";

interface MarketEvent {
    id: string;
    time: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    type: "earnings" | "economic" | "dividend" | "ipo" | "split";
    symbol?: string;
    actual?: string;
    forecast?: string;
}

const upcomingEvents: MarketEvent[] = [
    {
        id: "1",
        time: "09:30 AM",
        title: "NVDA Earnings Report",
        description: "Q4 2025 Earnings Release",
        impact: "high",
        type: "earnings",
        symbol: "NVDA",
        forecast: "$5.42 EPS",
    },
    {
        id: "2",
        time: "10:00 AM",
        title: "US Consumer Confidence",
        description: "January 2026 Reading",
        impact: "high",
        type: "economic",
        forecast: "108.5",
    },
    {
        id: "3",
        time: "11:00 AM",
        title: "AAPL Dividend Ex-Date",
        description: "$0.25 per share",
        impact: "medium",
        type: "dividend",
        symbol: "AAPL",
    },
    {
        id: "4",
        time: "02:00 PM",
        title: "Fed FOMC Minutes",
        description: "December Meeting Notes",
        impact: "high",
        type: "economic",
    },
    {
        id: "5",
        time: "04:00 PM",
        title: "TSLA Q4 Deliveries",
        description: "Quarterly Vehicle Report",
        impact: "medium",
        type: "earnings",
        symbol: "TSLA",
        forecast: "510K units",
    },
];

const getEventIcon = (type: string) => {
    switch (type) {
        case "earnings":
            return <BarChart3 className="w-4 h-4" />;
        case "economic":
            return <Megaphone className="w-4 h-4" />;
        case "dividend":
            return <DollarSign className="w-4 h-4" />;
        case "ipo":
            return <TrendingUp className="w-4 h-4" />;
        case "split":
            return <AlertCircle className="w-4 h-4" />;
        default:
            return <Calendar className="w-4 h-4" />;
    }
};

const getImpactColor = (impact: string) => {
    switch (impact) {
        case "high":
            return "bg-red-500/20 text-red-400 border-red-500/30";
        case "medium":
            return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        case "low":
            return "bg-green-500/20 text-green-400 border-green-500/30";
        default:
            return "bg-muted/20 text-muted-foreground";
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case "earnings":
            return "bg-purple-500/20 text-purple-400";
        case "economic":
            return "bg-blue-500/20 text-blue-400";
        case "dividend":
            return "bg-green-500/20 text-green-400";
        case "ipo":
            return "bg-orange-500/20 text-orange-400";
        case "split":
            return "bg-cyan-500/20 text-cyan-400";
        default:
            return "bg-muted/20 text-muted-foreground";
    }
};

const MarketTimeline = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">TODAY'S TIMELINE</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

                <div className="space-y-3">
                    {upcomingEvents.map((event, index) => (
                        <div
                            key={event.id}
                            className="relative flex gap-4 group"
                        >
                            {/* Timeline dot */}
                            <div className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center ${getTypeColor(event.type)} 
                             transition-all group-hover:scale-110 group-hover:shadow-lg`}>
                                {getEventIcon(event.type)}
                            </div>

                            {/* Event content */}
                            <div className="flex-1 pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-primary">{event.time}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getImpactColor(event.impact)}`}>
                                                {event.impact.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                                    </div>
                                    {event.symbol && (
                                        <span className="px-2 py-1 rounded bg-secondary/50 text-xs font-mono font-medium">
                                            ${event.symbol}
                                        </span>
                                    )}
                                </div>
                                {event.forecast && (
                                    <div className="mt-2 flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Forecast:</span>
                                        <span className="font-mono text-primary">{event.forecast}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* View More */}
            <button className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded-lg hover:border-primary/30 hover:bg-primary/5">
                View Full Calendar →
            </button>
        </div>
    );
};

export default MarketTimeline;
