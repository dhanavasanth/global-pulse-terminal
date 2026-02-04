import { OptionsProvider, useOptions } from "@/contexts/OptionsContext";
import { Sparkles, ArrowLeft, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

// Import all options components
import OptionsSelector from "@/components/options/OptionsSelector";
import PriceChart from "@/components/options/PriceChart";
import STRIndicator from "@/components/options/STRIndicator";
import StraddleVWAP from "@/components/options/StraddleVWAP";
import XRPIndicator from "@/components/options/XRPIndicator";
import VIXChart from "@/components/options/VIXChart";
import MSVTable from "@/components/options/MSVTable";
import ReEntrySignals from "@/components/options/ReEntrySignals";
import AIInsightPanel from "@/components/options/AIInsightPanel";
import TradingViewMiniChart from "@/components/TradingViewMiniChart";
import OptionChainSidebar from "@/components/options/OptionChainSidebar";
import { useState } from "react";

// Inner component that uses the context
const OptionsLabContent = () => {
    const { isLiveData, connectionStatus, isLoading, fetchData } = useOptions();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background grid-bg">
            {/* Header */}
            <header className="glass-card border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">Dashboard</span>
                        </Link>

                        <div className="h-8 w-px bg-border/50" />

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isLiveData ? 'bg-bullish' : 'bg-yellow-500'} live-pulse`} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">
                                    <span className="text-glow-cyan">ThinnAIQ</span>{" "}
                                    <span className="text-primary">Options Lab</span>
                                </h1>
                                <p className="text-xs text-muted-foreground font-mono">
                                    Smart Money • Volatility • Direction
                                </p>
                            </div>
                        </div>

                        {/* OrderFlow Button - Close to title */}
                        <Link
                            to="/order-flow"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 hover:text-primary transition-all border border-border/50 text-xs font-medium text-muted-foreground"
                        >
                            <Activity className="w-3.5 h-3.5" />
                            OrderFlow
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3 text-primary" />
                                <span className="text-muted-foreground">NIFTY • BANKNIFTY • SENSEX</span>
                            </div>
                        </div>

                        {/* Option Chain Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors border border-border/50 text-xs font-medium"
                        >
                            <Activity className="w-3.5 h-3.5 text-primary" />
                            Option Chain
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Connection Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isLiveData
                            ? 'bg-bullish/10 border border-bullish/30'
                            : connectionStatus === 'not_configured'
                                ? 'bg-yellow-500/10 border border-yellow-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}>
                            {isLiveData ? (
                                <>
                                    <Wifi className="w-3.5 h-3.5 text-bullish" />
                                    <span className="text-xs font-medium text-bullish">LIVE</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className={`w-3.5 h-3.5 ${connectionStatus === 'not_configured' ? 'text-yellow-500' : 'text-red-500'}`} />
                                    <span className={`text-xs font-medium ${connectionStatus === 'not_configured' ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {connectionStatus === 'not_configured' ? 'DEMO' : 'OFFLINE'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full px-4 py-4 space-y-4">
                {/* ATM & Expiry Selector */}
                <OptionsSelector />

                {/* AI Insight Panel - Prominent Position */}
                <AIInsightPanel />

                {/* Price Chart - Full Width */}
                <PriceChart />

                {/* Mini Charts Row - Quick Price Reference */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TradingViewMiniChart symbol="NSE:NIFTY" height={150} />
                    <TradingViewMiniChart symbol="NSE:BANKNIFTY" height={150} />
                    <TradingViewMiniChart symbol="CBOE:VIX" height={150} />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Row 1: STR (2/3) + VIX (1/3) */}
                    <div className="lg:col-span-2">
                        <STRIndicator />
                    </div>
                    <div className="lg:col-span-1">
                        <VIXChart />
                    </div>

                    {/* Row 2: Straddle + MSV + ReEntry (Equal width) */}
                    <div className="lg:col-span-1">
                        <StraddleVWAP />
                    </div>
                    <div className="lg:col-span-1">
                        <MSVTable />
                    </div>
                    <div className="lg:col-span-1">
                        <ReEntrySignals />
                    </div>

                    {/* Row 3: XRP (2/3) + Space/New Widget */}
                    <div className="lg:col-span-2">
                        <XRPIndicator />
                    </div>
                    {/* Empty slot or future widget */}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 mt-8">
                <div className="container px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <p className="font-semibold text-foreground">© 2026 ThinnAIQ Options Intelligence Lab</p>
                            <span className="hidden md:inline">|</span>
                            <p className="font-mono">Smart Money • Volatility • Direction • Control</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {isLiveData ? (
                                <span className="px-2 py-1 rounded bg-bullish/10 text-bullish text-[10px] font-medium flex items-center gap-1">
                                    <Wifi className="w-3 h-3" />
                                    Connected to Angel One
                                </span>
                            ) : connectionStatus === 'not_configured' ? (
                                <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-medium">
                                    ⚠ Demo Mode - Configure .env for live data
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium">
                                    ⚠ Disconnected - Please login to Angel One
                                </span>
                            )}
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-medium">
                                Powered by ThinnAIQ
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
            {/* Option Chain Sidebar */}
            <OptionChainSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>
    );
};

const OptionsLab = () => {
    return (
        <OptionsProvider>
            <OptionsLabContent />
        </OptionsProvider>
    );
};

export default OptionsLab;
