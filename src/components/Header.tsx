import { Activity, Globe, Wifi, Sparkles, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface HeaderProps {
  onOpenScreener?: () => void;
}

const Header = ({ onOpenScreener }: HeaderProps) => {
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
    <header className="glass-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-bullish rounded-full live-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-glow-cyan">Thinn</span><span className="text-primary">AIQ</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Market Screener • Real-Time Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-border/50">
            <Link
              to="/options-lab"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 hover:border-primary/50 hover:bg-primary/10 transition-all group"
            >
              <FlaskConical className="w-4 h-4 text-purple-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Options Lab
              </span>
            </Link>
            <Link
              to="/order-flow"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/30 hover:border-primary/50 hover:bg-primary/10 transition-all group"
            >
              <Activity className="w-4 h-4 text-blue-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Order Flow
              </span>
            </Link>
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
