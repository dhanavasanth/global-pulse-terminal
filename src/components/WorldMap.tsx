import { useEffect, useState } from "react";

interface MarketNode {
  id: string;
  name: string;
  x: number;
  y: number;
  session: "asia" | "london" | "ny";
  isOpen: boolean;
  intensity: number;
}

const marketNodes: MarketNode[] = [
  { id: "tokyo", name: "Tokyo", x: 82, y: 35, session: "asia", isOpen: false, intensity: 0.6 },
  { id: "hongkong", name: "Hong Kong", x: 76, y: 42, session: "asia", isOpen: false, intensity: 0.7 },
  { id: "singapore", name: "Singapore", x: 72, y: 55, session: "asia", isOpen: false, intensity: 0.5 },
  { id: "mumbai", name: "Mumbai", x: 62, y: 45, session: "asia", isOpen: false, intensity: 0.8 },
  { id: "london", name: "London", x: 47, y: 28, session: "london", isOpen: false, intensity: 0.9 },
  { id: "frankfurt", name: "Frankfurt", x: 50, y: 27, session: "london", isOpen: false, intensity: 0.7 },
  { id: "newyork", name: "New York", x: 25, y: 32, session: "ny", isOpen: false, intensity: 1.0 },
  { id: "chicago", name: "Chicago", x: 22, y: 30, session: "ny", isOpen: false, intensity: 0.6 },
];

const WorldMap = () => {
  const [nodes, setNodes] = useState(marketNodes);
  const [, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      setCurrentTime(now);

      setNodes(prev => prev.map(node => {
        let isOpen = false;
        const hour = now.getUTCHours();

        if (node.session === "asia") {
          isOpen = hour >= 0 && hour < 9;
        } else if (node.session === "london") {
          isOpen = hour >= 8 && hour < 17;
        } else if (node.session === "ny") {
          isOpen = hour >= 13 && hour < 22;
        }

        return { ...node, isOpen, intensity: isOpen ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.1 };
      }));
    };

    updateSessions();
    const interval = setInterval(updateSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSessionColor = (session: string) => {
    switch (session) {
      case "asia": return "hsl(var(--session-asia))";
      case "london": return "hsl(var(--session-london))";
      case "ny": return "hsl(var(--session-ny))";
      default: return "hsl(var(--primary))";
    }
  };

  return (
    <div className="glass-card p-4 relative overflow-hidden">
      <h2 className="text-sm font-semibold tracking-wide mb-4">GLOBAL LIQUIDITY MAP</h2>
      
      {/* Simplified World Map Background */}
      <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        {/* Simplified continent outlines using SVG */}
        <svg
          viewBox="0 0 100 60"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Americas */}
          <path
            d="M15,15 Q20,10 25,15 L28,25 Q30,35 25,45 L20,50 Q15,55 12,50 L10,40 Q8,30 10,25 Z"
            fill="hsl(var(--secondary))"
            opacity="0.4"
          />
          
          {/* Europe/Africa */}
          <path
            d="M42,18 Q48,15 52,20 L55,30 Q58,40 55,50 L48,55 Q42,58 38,52 L35,40 Q33,30 38,22 Z"
            fill="hsl(var(--secondary))"
            opacity="0.4"
          />
          
          {/* Asia */}
          <path
            d="M60,20 Q70,15 80,18 L88,25 Q92,35 88,45 L80,50 Q70,55 62,48 L55,40 Q52,30 58,22 Z"
            fill="hsl(var(--secondary))"
            opacity="0.4"
          />

          {/* Connection lines between nodes */}
          {nodes.map((node, i) => 
            nodes.slice(i + 1).filter(n => n.session === node.session).map(target => (
              <line
                key={`${node.id}-${target.id}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={getSessionColor(node.session)}
                strokeWidth="0.3"
                opacity={node.isOpen ? 0.6 : 0.1}
              />
            ))
          )}
        </svg>

        {/* Market nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* Glow ring */}
            {node.isOpen && (
              <div
                className="absolute inset-0 w-8 h-8 -ml-2 -mt-2 rounded-full animate-pulse-glow"
                style={{
                  backgroundColor: `${getSessionColor(node.session)}20`,
                  boxShadow: `0 0 ${20 * node.intensity}px ${getSessionColor(node.session)}`,
                }}
              />
            )}
            
            {/* Node dot */}
            <div
              className="w-3 h-3 rounded-full border-2 transition-all duration-300"
              style={{
                backgroundColor: node.isOpen ? getSessionColor(node.session) : 'transparent',
                borderColor: getSessionColor(node.session),
                opacity: node.isOpen ? 1 : 0.4,
              }}
            />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="glass-card px-2 py-1 text-xs whitespace-nowrap">
                <span className="font-medium">{node.name}</span>
                <span className={`ml-2 ${node.isOpen ? 'text-bullish' : 'text-muted-foreground'}`}>
                  {node.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-session-asia" />
          <span className="text-xs text-muted-foreground">Asia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-session-london" />
          <span className="text-xs text-muted-foreground">London</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-session-ny" />
          <span className="text-xs text-muted-foreground">New York</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
