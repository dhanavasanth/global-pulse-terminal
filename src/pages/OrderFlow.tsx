import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrderFlow, OrderFlowProvider } from "@/contexts/OrderFlowContext";
import FootprintChart from "@/components/order-flow/FootprintChart";
import LiquidityDOM from "@/components/order-flow/LiquidityDOM";
import DeltaPanel from "@/components/order-flow/DeltaPanel";
import { LightweightChart, useChartSync } from "@/components/lightweight-charts";
import { Activity, Settings2, BarChart2, Layers, ChevronDown, LineChart, SplitSquareVertical, ArrowLeft, Sparkles, FlaskConical, Wifi } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import OrderbookTable from "@/components/Orderflow/OrderbookTable";

// Wrapper that provides the context to the page content
const OrderFlowDashboard = () => {
    return (
        <OrderFlowProvider>
            <OrderFlowContent />
        </OrderFlowProvider>
    );
};

const OrderFlowContent = () => {
    const { isConnected, symbol, setSymbol, timeframe, setTimeframe, lastPrice, imbalanceRatio, setImbalanceRatio, assets, decimals } = useOrderFlow();
    const { candlestickData, volumeData } = useChartSync();
    const [showCompanionChart, setShowCompanionChart] = useState(false);

    // Group assets by type
    const groupedAssets = Object.entries(assets).reduce((acc, [key, def]) => {
        if (!acc[def.type]) acc[def.type] = [];
        acc[def.type].push(key);
        return acc;
    }, {} as Record<string, string[]>);

    const customHeader = (
        <header className="glass-card border-b border-border px-6 py-3">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-foreground">OrderFlow</h1>
                    <p className="text-xs text-muted-foreground font-mono">Footprint • DOM • Delta</p>
                </div>
            </div>
        </header>
    );

    return (
        <MainLayout header={customHeader}>
            <div className="grid grid-cols-12 gap-4 h-full">
                {/* Top Control Bar */}
                <div className="col-span-12 glass-card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <select
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                className="appearance-none bg-secondary border border-border/50 rounded-lg pl-9 pr-8 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[160px]"
                            >
                                {Object.keys(groupedAssets).map(type => (
                                    <optgroup key={type} label={type}>
                                        {groupedAssets[type].map(key => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <Activity className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isConnected ? "text-bullish live-pulse" : "text-muted-foreground"}`} />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>

                        <span className="text-sm font-mono text-primary border-l border-border/50 pl-2 ml-2">
                            {Number(lastPrice).toFixed(decimals)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {["1s", "5s", "1m", "5m", "1h", "4h"].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeframe === tf ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-bullish"></span> Connection: <span className="text-foreground">Stable (12ms)</span>
                        </div>

                        {/* Companion Chart Toggle */}
                        <button
                            onClick={() => setShowCompanionChart(!showCompanionChart)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${showCompanionChart
                                ? 'bg-primary/20 text-primary border-primary/50'
                                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground'
                                }`}
                            title="Toggle OHLCV Chart"
                        >
                            <LineChart className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">OHLCV</span>
                            <SplitSquareVertical className="w-3 h-3" />
                        </button>

                        {/* Settings Popover */}
                        <div className="relative group">
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                <Settings2 className="w-4 h-4" />
                            </button>

                            {/* Popover Content */}
                            <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-xl glass-card border border-border/50 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                <h3 className="text-sm font-semibold mb-3">Chart Settings</h3>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Imbalance Ratio</span>
                                            <span className="font-mono">{imbalanceRatio}:1</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1.5"
                                            max="10"
                                            step="0.5"
                                            value={imbalanceRatio}
                                            onChange={(e) => setImbalanceRatio(Number(e.target.value))}
                                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Cluster View</span>
                                            <span className="text-bullish">Bid x Ask</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground text-center">
                                        Changes apply to new bars only
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chart Area - Split View when companion is enabled */}
                <div className={`glass-card p-4 relative overflow-hidden flex flex-col ${showCompanionChart ? 'col-span-6' : 'col-span-9'} md:col-span-${showCompanionChart ? '5' : '8'} lg:col-span-${showCompanionChart ? '6' : '9'} transition-all min-h-[500px]`}>
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <BarChart2 className="w-4 h-4" />
                        Footprint Chart
                    </div>
                    <div className="flex-1 border border-border/30 rounded-lg bg-black/20 relative overflow-hidden" style={{ height: '450px', maxHeight: '450px' }}>
                        <FootprintChart />
                    </div>
                </div>

                {/* Companion Chart Panel - Lightweight Charts OHLCV */}
                {showCompanionChart && (
                    <div className="col-span-3 md:col-span-3 lg:col-span-3 glass-card p-4 relative overflow-hidden flex flex-col transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                                <LineChart className="w-4 h-4" />
                                OHLCV Chart
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
                                Lightweight Charts
                            </span>
                        </div>
                        <div className="flex-1 border border-border/30 rounded-lg bg-black/20 relative overflow-hidden min-h-[200px]">
                            <LightweightChart
                                data={candlestickData}
                                volumeData={volumeData}
                                height={400}
                                showVolume={true}
                            />
                        </div>
                    </div>
                )}

                {/* Right Panel: DOM & Stats */}
                <div className="col-span-3 glass-card p-4 flex flex-col gap-4 md:col-span-4 lg:col-span-3">
                    {/* DOM / Heatmap Section */}
                    <div className="flex-1 flex flex-col min-h-0 bg-secondary/5 rounded-lg border border-border/30 overflow-hidden">
                        <div className="flex items-center gap-2 p-2 border-b border-border/10">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Liquidity Map</span>
                        </div>
                        <OrderbookTable />
                    </div>

                    {/* Delta / Trade Stats Section */}
                    <div className="h-1/3 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                            <Activity className="w-4 h-4" />
                            Session Stats
                        </div>
                        <div className="flex-1 border border-border/30 rounded-lg bg-secondary/10 p-2 overflow-hidden">
                            <DeltaPanel />
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default OrderFlowDashboard;
