import { Activity, Globe, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, timezone: string) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <header className="glass-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Globe className="w-8 h-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-bullish rounded-full live-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-glow-cyan">
                GLOBAL MARKETS
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Real-Time Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* World Clocks */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">TOKYO</p>
              <p className="font-mono text-sm text-session-asia">
                {formatTime(currentTime, 'Asia/Tokyo')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">LONDON</p>
              <p className="font-mono text-sm text-session-london">
                {formatTime(currentTime, 'Europe/London')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">NEW YORK</p>
              <p className="font-mono text-sm text-session-ny">
                {formatTime(currentTime, 'America/New_York')}
              </p>
            </div>
          </div>

          {/* Live Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bullish/10 border border-bullish/30">
            <Wifi className="w-4 h-4 text-bullish" />
            <span className="text-xs font-medium text-bullish">LIVE</span>
            <Activity className="w-4 h-4 text-bullish live-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
