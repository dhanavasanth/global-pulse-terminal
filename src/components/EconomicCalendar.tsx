import { Calendar, AlertTriangle, TrendingUp } from "lucide-react";

interface EconomicEvent {
  time: string;
  country: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
  previous?: string;
}

const events: EconomicEvent[] = [
  { time: "08:30", country: "US", event: "Initial Jobless Claims", impact: "high", forecast: "215K", previous: "211K" },
  { time: "10:00", country: "US", event: "Existing Home Sales", impact: "medium", forecast: "4.15M", previous: "4.09M" },
  { time: "14:00", country: "UK", event: "BoE Interest Rate Decision", impact: "high", forecast: "4.50%", previous: "4.75%" },
  { time: "15:30", country: "EU", event: "ECB President Lagarde Speech", impact: "high" },
  { time: "21:00", country: "JP", event: "Trade Balance", impact: "medium", forecast: "-¥234B", previous: "-¥461B" },
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high": return "text-bearish bg-bearish/10 border-bearish/30";
    case "medium": return "text-warning bg-warning/10 border-warning/30";
    default: return "text-muted-foreground bg-muted/50 border-border";
  }
};

const getCountryFlag = (country: string) => {
  switch (country) {
    case "US": return "🇺🇸";
    case "UK": return "🇬🇧";
    case "EU": return "🇪🇺";
    case "JP": return "🇯🇵";
    default: return "🌐";
  }
};

const EconomicCalendar = () => {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide">ECONOMIC CALENDAR</h2>
      </div>

      <div className="space-y-2">
        {events.map((event, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border hover:border-primary/20 transition-colors"
          >
            <div className="text-center min-w-[50px]">
              <span className="font-mono text-xs text-muted-foreground">{event.time}</span>
            </div>
            
            <div className="text-lg">{getCountryFlag(event.country)}</div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{event.event}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {event.forecast && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    F: {event.forecast}
                  </span>
                )}
                {event.previous && <span>P: {event.previous}</span>}
              </div>
            </div>
            
            <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getImpactColor(event.impact)}`}>
              {event.impact === "high" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {event.impact.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomicCalendar;
