import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import MarketSessions from "@/components/MarketSessions";
import WorldMap from "@/components/WorldMap";
import IndicesBoard from "@/components/IndicesBoard";
import TradingViewChart from "@/components/TradingViewChart";
import ForexPanel from "@/components/ForexPanel";
import CryptoPanel from "@/components/CryptoPanel";
import CommoditiesPanel from "@/components/CommoditiesPanel";
import EconomicCalendar from "@/components/EconomicCalendar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />
      <TickerStrip />
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <MarketSessions />
            <EconomicCalendar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-4">
            <WorldMap />
            <IndicesBoard />
            <TradingViewChart symbol="NASDAQ:AAPL" height={450} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <ForexPanel />
            <CryptoPanel />
            <CommoditiesPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>© 2026 Global Markets Intelligence Platform</p>
            <p className="font-mono">
              One Screen. All Markets. Real Time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
