import { useEffect, useState } from "react";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface Session {
  name: string;
  city: string;
  timezone: string;
  openHour: number;
  closeHour: number;
  color: string;
  volatility: number;
}

const sessions: Session[] = [
  { name: "ASIA", city: "Tokyo / Hong Kong", timezone: "Asia/Tokyo", openHour: 0, closeHour: 9, color: "session-asia", volatility: 42 },
  { name: "LONDON", city: "London / Frankfurt", timezone: "Europe/London", openHour: 8, closeHour: 17, color: "session-london", volatility: 78 },
  { name: "NEW YORK", city: "New York / Chicago", timezone: "America/New_York", openHour: 8, closeHour: 17, color: "session-ny", volatility: 85 },
];

const getSessionStatus = (session: Session): { status: string; statusClass: string } => {
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: session.timezone }));
  const hour = localTime.getHours();

  if (hour >= session.openHour && hour < session.closeHour) {
    if (hour >= session.closeHour - 1) {
      return { status: "CLOSING SOON", statusClass: "status-closing" };
    }
    return { status: "OPEN", statusClass: "status-open" };
  }
  return { status: "CLOSED", statusClass: "status-closed" };
};

const MarketSessions = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold tracking-wide">MARKET SESSIONS</h2>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const { status, statusClass } = getSessionStatus(session);
          const isOpen = status === "OPEN";

          return (
            <div
              key={session.name}
              className={`relative p-3 rounded-lg bg-secondary/50 border border-border transition-all duration-300 ${
                isOpen ? "border-l-2" : ""
              }`}
              style={{ borderLeftColor: isOpen ? `hsl(var(--${session.color}))` : undefined }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-${session.color} font-bold text-sm`}>
                    {session.name}
                  </span>
                  {isOpen && (
                    <div className="w-2 h-2 rounded-full bg-bullish live-pulse" />
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                  {status}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">{session.city}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Volatility</span>
                  {session.volatility > 60 ? (
                    <TrendingUp className="w-3 h-3 text-bullish" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${session.volatility}%`,
                        backgroundColor: session.volatility > 70 ? 'hsl(var(--bullish))' : 
                                        session.volatility > 40 ? 'hsl(var(--warning))' : 
                                        'hsl(var(--muted-foreground))'
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {session.volatility}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketSessions;
