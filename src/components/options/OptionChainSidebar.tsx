import { X, RefreshCw, TrendingUp } from "lucide-react";
import { useOptions } from "@/contexts/OptionsContext";
import { formatNumber } from "@/lib/utils";

interface OptionChainSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const OptionChainSidebar = ({ isOpen, onClose }: OptionChainSidebarProps) => {
    const {
        optionsChain,
        isLoading,
        fetchData,
        spotPrice,
        selectedIndex,
        expiry
    } = useOptions();

    // Determine ATM strike to highlight
    const atmStrike = optionsChain.reduce((prev, curr) => {
        return Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev;
    }, optionsChain[0])?.strike;

    return (
        <div
            className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Option Chain</h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {selectedIndex} <span className="text-border">|</span> {expiry} <span className="text-border">|</span> Spot: <span className="text-primary font-mono">{spotPrice.toFixed(2)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="h-[calc(100vh-80px)] overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <table className="w-full text-xs border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10 text-[10px] font-medium text-muted-foreground">
                        <tr>
                            <th colSpan={4} className="py-2 text-center text-bullish border-b border-r border-border/50">CALLS</th>
                            <th className="py-2 text-center border-b border-border/50 bg-background/50">STRIKE</th>
                            <th colSpan={4} className="py-2 text-center text-bearish border-b border-border/50">PUTS</th>
                        </tr>
                        <tr>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[10%]">OI</th>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[10%]">Vol</th>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[12%]">LTP</th>
                            <th className="py-2 px-1 text-right border-b border-r border-border/50 font-normal w-[8%]">IV</th>

                            <th className="py-2 px-2 text-center border-b border-border/50 bg-background/50 w-[10%]">Strike</th>

                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[8%]">IV</th>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[12%]">LTP</th>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[10%]">Vol</th>
                            <th className="py-2 px-1 text-right border-b border-border/50 font-normal w-[10%]">OI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {optionsChain.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-10 text-center text-muted-foreground">
                                    No data available. Try refreshing or changing expiry.
                                </td>
                            </tr>
                        ) : (
                            optionsChain.map((row) => {
                                const isATM = row.strike === atmStrike;
                                const isITM_Call = row.strike < spotPrice;
                                const isITM_Put = row.strike > spotPrice;

                                return (
                                    <tr
                                        key={row.strike}
                                        className={`hover:bg-accent/30 transition-colors ${isATM ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        {/* CALLS */}
                                        <td className={`py-1.5 px-1 text-right relative ${isITM_Call ? 'bg-bullish/5' : ''}`}>
                                            <span className="relative z-10">{formatNumber(row.callOI)}</span>
                                            {/* OI Bar could go here */}
                                        </td>
                                        <td className={`py-1.5 px-1 text-right text-muted-foreground ${isITM_Call ? 'bg-bullish/5' : ''}`}>
                                            {formatNumber(row.callVolume)}
                                        </td>
                                        <td className={`py-1.5 px-1 text-right font-medium ${isITM_Call ? 'bg-bullish/5' : ''}`}>
                                            <span className={row.callPrice > 0 ? "text-foreground" : "text-muted-foreground"}>
                                                {row.callPrice.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className={`py-1.5 px-1 text-right text-muted-foreground border-r border-border/30 ${isITM_Call ? 'bg-bullish/5' : ''}`}>
                                            {row.callIV ? row.callIV.toFixed(1) : '-'}
                                        </td>

                                        {/* STRIKE */}
                                        <td className={`py-1.5 px-2 text-center font-bold font-mono text-sm ${isATM ? 'text-primary bg-primary/10' : ''
                                            }`}>
                                            {row.strike}
                                        </td>

                                        {/* PUTS */}
                                        <td className={`py-1.5 px-1 text-right text-muted-foreground ${isITM_Put ? 'bg-bearish/5' : ''}`}>
                                            {row.putIV ? row.putIV.toFixed(1) : '-'}
                                        </td>
                                        <td className={`py-1.5 px-1 text-right font-medium ${isITM_Put ? 'bg-bearish/5' : ''}`}>
                                            <span className={row.putPrice > 0 ? "text-foreground" : "text-muted-foreground"}>
                                                {row.putPrice.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className={`py-1.5 px-1 text-right text-muted-foreground ${isITM_Put ? 'bg-bearish/5' : ''}`}>
                                            {formatNumber(row.putVolume)}
                                        </td>
                                        <td className={`py-1.5 px-1 text-right relative ${isITM_Put ? 'bg-bearish/5' : ''}`}>
                                            <span className="relative z-10">{formatNumber(row.putOI)}</span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}
        </div>
    );
};

export default OptionChainSidebar;
