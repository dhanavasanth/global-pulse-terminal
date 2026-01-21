import { useEffect, useState } from "react";
import { Globe, Activity } from "lucide-react";

interface MarketNode {
  id: string;
  name: string;
  x: number;
  y: number;
  session: "asia" | "london" | "ny";
  isOpen: boolean;
  intensity: number;
  volume: string;
}

const marketNodes: MarketNode[] = [
  { id: "tokyo", name: "Tokyo", x: 85, y: 32, session: "asia", isOpen: false, intensity: 0.6, volume: "$1.2T" },
  { id: "hongkong", name: "Hong Kong", x: 79, y: 42, session: "asia", isOpen: false, intensity: 0.7, volume: "$890B" },
  { id: "singapore", name: "Singapore", x: 75, y: 58, session: "asia", isOpen: false, intensity: 0.5, volume: "$650B" },
  { id: "mumbai", name: "Mumbai", x: 64, y: 45, session: "asia", isOpen: false, intensity: 0.8, volume: "$420B" },
  { id: "dubai", name: "Dubai", x: 56, y: 42, session: "asia", isOpen: false, intensity: 0.4, volume: "$180B" },
  { id: "london", name: "London", x: 47, y: 26, session: "london", isOpen: false, intensity: 0.9, volume: "$2.1T" },
  { id: "frankfurt", name: "Frankfurt", x: 50, y: 25, session: "london", isOpen: false, intensity: 0.7, volume: "$780B" },
  { id: "zurich", name: "Zurich", x: 49, y: 28, session: "london", isOpen: false, intensity: 0.5, volume: "$340B" },
  { id: "newyork", name: "New York", x: 26, y: 32, session: "ny", isOpen: false, intensity: 1.0, volume: "$2.8T" },
  { id: "chicago", name: "Chicago", x: 22, y: 30, session: "ny", isOpen: false, intensity: 0.6, volume: "$560B" },
  { id: "toronto", name: "Toronto", x: 24, y: 26, session: "ny", isOpen: false, intensity: 0.4, volume: "$280B" },
];

const flowPaths = [
  { from: "tokyo", to: "hongkong", session: "asia" },
  { from: "hongkong", to: "singapore", session: "asia" },
  { from: "singapore", to: "mumbai", session: "asia" },
  { from: "mumbai", to: "dubai", session: "asia" },
  { from: "dubai", to: "london", session: "london" },
  { from: "london", to: "frankfurt", session: "london" },
  { from: "frankfurt", to: "zurich", session: "london" },
  { from: "london", to: "newyork", session: "ny" },
  { from: "newyork", to: "chicago", session: "ny" },
  { from: "chicago", to: "toronto", session: "ny" },
];

const WorldMap = () => {
  const [nodes, setNodes] = useState(marketNodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      const hour = now.getUTCHours();

      setNodes(prev => prev.map(node => {
        let isOpen = false;

        if (node.session === "asia") {
          isOpen = hour >= 0 && hour < 9;
        } else if (node.session === "london") {
          isOpen = hour >= 7 && hour < 16;
        } else if (node.session === "ny") {
          isOpen = hour >= 13 && hour < 22;
        }

        return { 
          ...node, 
          isOpen, 
          intensity: isOpen ? 0.7 + Math.random() * 0.3 : 0.15 + Math.random() * 0.1 
        };
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

  const getNodePosition = (id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const activeFlows = flowPaths.filter(flow => {
    const fromNode = nodes.find(n => n.id === flow.from);
    return fromNode?.isOpen;
  });

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold tracking-wide">GLOBAL LIQUIDITY FLOW</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-bullish animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">REAL-TIME</span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-56 md:h-72 rounded-xl overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background border border-border/50">
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        <svg
          viewBox="0 0 100 70"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Gradients for flow lines */}
            <linearGradient id="flowAsia" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--session-asia))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--session-asia))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--session-asia))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="flowLondon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--session-london))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--session-london))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--session-london))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="flowNy" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--session-ny))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--session-ny))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--session-ny))" stopOpacity="0" />
            </linearGradient>
            
            {/* Glow filters */}
            <filter id="glowAsia" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowLondon" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowNy" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          
          {/* Simplified World Landmasses */}
          <g opacity="0.25">
            {/* North America */}
            <path
              d="M10,18 Q15,12 28,14 L32,18 Q35,25 30,35 L25,42 Q18,48 12,42 L8,32 Q6,24 10,18 Z"
              fill="hsl(var(--muted-foreground))"
            />
            {/* South America */}
            <path
              d="M20,48 Q25,45 28,50 L30,58 Q28,66 22,68 L18,65 Q14,58 18,50 Z"
              fill="hsl(var(--muted-foreground))"
            />
            {/* Europe */}
            <path
              d="M42,16 Q50,12 55,18 L58,24 Q56,30 50,32 L44,30 Q40,26 42,20 Z"
              fill="hsl(var(--muted-foreground))"
            />
            {/* Africa */}
            <path
              d="M44,36 Q52,32 56,38 L58,50 Q54,62 48,64 L42,58 Q38,48 42,40 Z"
              fill="hsl(var(--muted-foreground))"
            />
            {/* Asia */}
            <path
              d="M58,14 Q72,10 88,16 L92,28 Q90,42 82,48 L70,52 Q60,48 56,38 L55,26 Q56,18 58,14 Z"
              fill="hsl(var(--muted-foreground))"
            />
            {/* Australia */}
            <path
              d="M78,56 Q86,54 90,58 L92,64 Q88,68 82,68 L78,64 Q76,60 78,56 Z"
              fill="hsl(var(--muted-foreground))"
            />
          </g>

          {/* Capital Flow Lines */}
          {activeFlows.map((flow, idx) => {
            const from = getNodePosition(flow.from);
            const to = getNodePosition(flow.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 5;
            const gradientId = `flow${flow.session.charAt(0).toUpperCase() + flow.session.slice(1)}`;
            
            return (
              <g key={idx}>
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="0.8"
                  className="animate-pulse"
                  style={{ animationDelay: `${idx * 200}ms` }}
                />
                {/* Animated particle */}
                <circle r="0.8" fill={getSessionColor(flow.session)}>
                  <animateMotion
                    dur={`${2 + idx * 0.3}s`}
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Connection lines (inactive) */}
          {flowPaths.filter(flow => {
            const fromNode = nodes.find(n => n.id === flow.from);
            return !fromNode?.isOpen;
          }).map((flow, idx) => {
            const from = getNodePosition(flow.from);
            const to = getNodePosition(flow.to);
            return (
              <line
                key={`inactive-${idx}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="hsl(var(--border))"
                strokeWidth="0.3"
                strokeDasharray="2,2"
                opacity="0.3"
              />
            );
          })}
        </svg>

        {/* Market nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Outer glow ring */}
            {node.isOpen && (
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: `${24 * node.intensity}px`,
                  height: `${24 * node.intensity}px`,
                  left: `${-12 * node.intensity + 6}px`,
                  top: `${-12 * node.intensity + 6}px`,
                  backgroundColor: `${getSessionColor(node.session)}`,
                  opacity: 0.3,
                }}
              />
            )}
            
            {/* Inner glow */}
            {node.isOpen && (
              <div
                className="absolute rounded-full"
                style={{
                  width: '20px',
                  height: '20px',
                  left: '-4px',
                  top: '-4px',
                  background: `radial-gradient(circle, ${getSessionColor(node.session)}40 0%, transparent 70%)`,
                }}
              />
            )}
            
            {/* Node dot */}
            <div
              className="w-3 h-3 rounded-full border-2 transition-all duration-500 relative z-10"
              style={{
                backgroundColor: node.isOpen ? getSessionColor(node.session) : 'hsl(var(--background))',
                borderColor: getSessionColor(node.session),
                opacity: node.isOpen ? 1 : 0.5,
                boxShadow: node.isOpen ? `0 0 12px ${getSessionColor(node.session)}` : 'none',
              }}
            />
            
            {/* Enhanced Tooltip */}
            <div 
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 transition-all duration-200 pointer-events-none z-20
                         ${hoveredNode === node.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
            >
              <div className="glass-card px-3 py-2 min-w-[120px] text-center shadow-xl">
                <p className="font-semibold text-sm">{node.name}</p>
                <p className={`text-xs font-mono mt-1 ${node.isOpen ? 'text-bullish' : 'text-muted-foreground'}`}>
                  {node.isOpen ? '● OPEN' : '○ CLOSED'}
                </p>
                {node.isOpen && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Vol: <span className="text-foreground font-mono">{node.volume}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session legend with enhanced styling */}
      <div className="flex items-center justify-center gap-8 mt-5">
        {[
          { session: "asia", label: "Asia-Pacific", color: "bg-session-asia" },
          { session: "london", label: "London/EU", color: "bg-session-london" },
          { session: "ny", label: "New York", color: "bg-session-ny" },
        ].map(({ session, label, color }) => {
          const isActive = nodes.some(n => n.session === session && n.isOpen);
          return (
            <div key={session} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${color} ${isActive ? 'animate-pulse shadow-lg' : 'opacity-40'}`} 
                   style={{ boxShadow: isActive ? `0 0 8px hsl(var(--session-${session}))` : 'none' }} />
              <span className={`text-xs ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldMap;
