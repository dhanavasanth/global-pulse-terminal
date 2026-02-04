/**
 * ScreenerPopup Component
 * 
 * A slide-out panel from the right containing the TradingView Stock Screener.
 * Can be triggered from the header or any other location.
 */

import { useEffect, useRef, useState } from 'react';
import { X, Filter, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

type ScreenerType = 'stocks' | 'forex' | 'crypto';

interface ScreenerConfig {
    defaultScreen: string;
    market: string;
    title: string;
    description: string;
}

const screenerConfigs: Record<ScreenerType, ScreenerConfig> = {
    stocks: {
        defaultScreen: 'most_capitalized',
        market: 'india',
        title: 'Stock Screener',
        description: 'Filter Indian stocks by fundamentals',
    },
    forex: {
        defaultScreen: 'general',
        market: 'forex',
        title: 'Forex Screener',
        description: 'Major currency pairs',
    },
    crypto: {
        defaultScreen: 'general',
        market: 'crypto',
        title: 'Crypto Screener',
        description: 'Top cryptocurrencies',
    },
};

interface ScreenerPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ScreenerPopup({ isOpen, onClose }: ScreenerPopupProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<ScreenerType>('stocks');
    const [isFullWidth, setIsFullWidth] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !isOpen) return;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        const config = screenerConfigs[selectedType];

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            width: '100%',
            height: '100%',
            defaultColumn: 'overview',
            defaultScreen: config.defaultScreen,
            market: config.market,
            showToolbar: true,
            colorTheme: 'dark',
            locale: 'en',
            isTransparent: true,
        });

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        containerRef.current.appendChild(widgetContainer);
        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [selectedType, isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Popup Panel */}
            <div
                className={`fixed top-0 right-0 h-full bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl z-50 flex flex-col transition-all duration-300 ${isFullWidth ? 'w-full' : 'w-[600px] max-w-[90vw]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Filter className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-wide">STOCK SCREENER</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {screenerConfigs[selectedType].description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bullish/10 border border-bullish/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" />
                            <span className="text-xs text-bullish font-mono">LIVE</span>
                        </div>
                        <button
                            onClick={() => setIsFullWidth(!isFullWidth)}
                            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                            title={isFullWidth ? 'Minimize' : 'Maximize'}
                        >
                            {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Type Selector Tabs */}
                <div className="flex flex-wrap gap-2 p-4 border-b border-border/20">
                    {(Object.keys(screenerConfigs) as ScreenerType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedType === type
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            {screenerConfigs[type].title}
                        </button>
                    ))}
                </div>

                {/* Screener Widget */}
                <div className="flex-1 p-4 overflow-hidden">
                    <div
                        ref={containerRef}
                        className="tradingview-widget-container rounded-xl overflow-hidden border border-border/50 h-full"
                    />
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-border/30 text-center">
                    <span className="text-[10px] text-muted-foreground">
                        Press ESC to close • Powered by TradingView
                    </span>
                </div>
            </div>
        </>
    );
}
