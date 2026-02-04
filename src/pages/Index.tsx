import { useState } from "react";
import Header from "@/components/Header";
import TickerStrip from "@/components/TickerStrip";
import MarketSessions from "@/components/MarketSessions";

// TradingView Widgets
import IndicesBoard from "@/components/IndicesBoard";
import TradingViewChart from "@/components/TradingViewChart";
import TradingViewHeatmap from "@/components/TradingViewHeatmap";
import TradingViewTechnicalAnalysis from "@/components/TradingViewTechnicalAnalysis";
import TradingViewSymbolInfo from "@/components/TradingViewSymbolInfo";
import TradingViewEarningsCalendar from "@/components/TradingViewEarningsCalendar";

// Market Data Panels
import ForexPanel from "@/components/ForexPanel";
import CryptoPanel from "@/components/CryptoPanel";
import CommoditiesPanel from "@/components/CommoditiesPanel";
import EconomicCalendar from "@/components/EconomicCalendar";
import MarketNews from "@/components/MarketNews";

// New Premium Features
import FearGreedIndex from "@/components/FearGreedIndex";
import CurrencyConverter from "@/components/CurrencyConverter";
import MarketTimeline from "@/components/MarketTimeline";
import TopMovers from "@/components/TopMovers";
import CryptoOverview from "@/components/CryptoOverview";
import SelectedSymbolBanner from "@/components/SelectedSymbolBanner";

// New Layout Components
import SideMenu from "@/components/SideMenu";
import WatchlistSidebar from "@/components/WatchlistSidebar";
import ScreenerPopup from "@/components/ScreenerPopup";

import { ChartProvider } from "@/contexts/ChartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

const Index = () => {
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(true);
  const [isScreenerOpen, setIsScreenerOpen] = useState(false);

  return (
    <FavoritesProvider>
      <ChartProvider>
        <div className="min-h-screen bg-background grid-bg flex">
          {/* Side Menu */}
          <SideMenu
            isCollapsed={isSideMenuCollapsed}
            onToggle={() => setIsSideMenuCollapsed(!isSideMenuCollapsed)}
            onOpenScreener={() => setIsScreenerOpen(true)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header onOpenScreener={() => setIsScreenerOpen(true)} />
            <TickerStrip />

            <main className="flex-1 overflow-y-auto">
              <div className="w-full px-4 py-4 space-y-4">
                {/* Selected Symbol Banner - Shows what's being analyzed */}
                <SelectedSymbolBanner />

                {/* Main Trading Chart */}
                <div className="w-full">
                  <TradingViewChart height={650} />
                </div>

                {/* Technical Analysis & Symbol Info Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <TradingViewSymbolInfo />
                  </div>
                  <TradingViewTechnicalAnalysis />
                </div>

                {/* Global Indices */}
                <div className="w-full">
                  <IndicesBoard />
                </div>

                {/* TradingView Heatmap */}
                <div className="w-full">
                  <TradingViewHeatmap />
                </div>

                {/* Premium Analytics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FearGreedIndex />
                  <TopMovers />
                  <CryptoOverview />
                </div>

                {/* Tools & Calendar Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <CurrencyConverter />
                  <MarketTimeline />
                  <TradingViewEarningsCalendar />
                </div>

                {/* Market Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Column 1 */}
                  <div className="space-y-4">
                    <MarketSessions />
                    <EconomicCalendar />
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-4">
                    <ForexPanel />
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-4">
                    <CryptoPanel />
                  </div>

                  {/* Column 4 */}
                  <div className="space-y-4">
                    <CommoditiesPanel />
                    <MarketNews />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <footer className="border-t border-border py-6 mt-8">
                <div className="container">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-foreground">© 2026 ThinnAIQ Market Screener</p>
                      <span className="hidden md:inline">|</span>
                      <p className="font-mono">One Screen. All Markets. Real Time.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-1 rounded bg-bullish/10 text-bullish text-[10px] font-medium">
                        ✓ All data is real-time
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-medium">
                        Powered by TradingView
                      </span>
                    </div>
                  </div>
                </div>
              </footer>
            </main>
          </div>

          {/* Watchlist Sidebar */}
          <WatchlistSidebar
            isOpen={isWatchlistOpen}
            onToggle={() => setIsWatchlistOpen(!isWatchlistOpen)}
          />

          {/* Screener Popup */}
          <ScreenerPopup
            isOpen={isScreenerOpen}
            onClose={() => setIsScreenerOpen(false)}
          />
        </div>
      </ChartProvider>
    </FavoritesProvider>
  );
};

export default Index;
