import { useEffect, useRef, useState } from 'react';
import MainLayout from "@/components/MainLayout";
import { Filter, Wifi, Sparkles } from 'lucide-react';

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
        title: 'Stocks',
        description: 'Filter Indian stocks by fundamentals',
    },
    forex: {
        defaultScreen: 'general',
        market: 'forex',
        title: 'Forex',
        description: 'Major currency pairs',
    },
    crypto: {
        defaultScreen: 'general',
        market: 'crypto',
        title: 'Crypto',
        description: 'Top cryptocurrencies',
    },
};

const Screener = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedType, setSelectedType] = useState<ScreenerType>('stocks');

    useEffect(() => {
        if (!containerRef.current) return;

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
    }, [selectedType]);

    const customHeader = (
        <header className="glass-card border-b border-border px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Multi-Asset Screener</h1>
                    <p className="text-xs text-muted-foreground font-mono">{screenerConfigs[selectedType].description}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-secondary/50 rounded-lg">
                        {(Object.keys(screenerConfigs) as ScreenerType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedType === type
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {screenerConfigs[type].title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );

    return (
        <MainLayout header={customHeader}>
            <div className="flex flex-col h-full space-y-4 p-4 md:p-6">

                {/* Screener Widget */}
                <div className="flex-1 glass-card p-0 overflow-hidden border border-border/50 relative bg-background/50 min-h-[500px]">
                    <div
                        ref={containerRef}
                        className="tradingview-widget-container w-full h-full"
                    />
                </div>
            </div>
        </MainLayout>
    );
};

export default Screener;
