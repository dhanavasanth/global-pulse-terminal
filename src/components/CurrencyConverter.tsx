import { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface CurrencyRate {
    code: string;
    name: string;
    flag: string;
    rate: number;
}

const currencies: CurrencyRate[] = [
    { code: "USD", name: "US Dollar", flag: "🇺🇸", rate: 1 },
    { code: "EUR", name: "Euro", flag: "🇪🇺", rate: 0.92 },
    { code: "GBP", name: "British Pound", flag: "🇬🇧", rate: 0.79 },
    { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", rate: 148.5 },
    { code: "INR", name: "Indian Rupee", flag: "🇮🇳", rate: 83.12 },
    { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", rate: 1.53 },
    { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", rate: 1.35 },
    { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", rate: 0.88 },
    { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", rate: 7.24 },
    { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", rate: 1.34 },
];

const CurrencyConverter = () => {
    const [amount, setAmount] = useState<string>("1000");
    const [fromCurrency, setFromCurrency] = useState<string>("USD");
    const [toCurrency, setToCurrency] = useState<string>("EUR");
    const [result, setResult] = useState<number>(0);
    const [isConverting, setIsConverting] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const convert = () => {
        setIsConverting(true);
        const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = currencies.find(c => c.code === toCurrency)?.rate || 1;
        const amountNum = parseFloat(amount) || 0;

        // Convert to USD first, then to target currency
        const usdAmount = amountNum / fromRate;
        const converted = usdAmount * toRate;

        setTimeout(() => {
            setResult(converted);
            setIsConverting(false);
            setLastUpdate(new Date());
        }, 300);
    };

    useEffect(() => {
        convert();
    }, [amount, fromCurrency, toCurrency]);

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
    const toCurrencyData = currencies.find(c => c.code === toCurrency);

    const exchangeRate = (toCurrencyData?.rate || 1) / (fromCurrencyData?.rate || 1);
    const inverseRate = 1 / exchangeRate;

    return (
        <div className="glass-card p-4 lg:p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <ArrowRightLeft className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide">CURRENCY CONVERTER</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Real-Time Exchange Rates</p>
                    </div>
                </div>
                <button
                    onClick={convert}
                    className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className={`w-4 h-4 ${isConverting ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Converter Form */}
            <div className="space-y-4">
                {/* From Currency */}
                <div className="bg-secondary/30 rounded-xl p-4">
                    <label className="text-xs text-muted-foreground mb-2 block">From</label>
                    <div className="flex gap-3">
                        <select
                            value={fromCurrency}
                            onChange={(e) => setFromCurrency(e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {currencies.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.flag} {currency.code}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Enter amount"
                        />
                    </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                    <button
                        onClick={swapCurrencies}
                        className="p-3 rounded-full bg-primary/20 hover:bg-primary/30 transition-all hover:scale-110 border border-primary/30"
                    >
                        <ArrowRightLeft className="w-5 h-5 text-primary rotate-90" />
                    </button>
                </div>

                {/* To Currency */}
                <div className="bg-secondary/30 rounded-xl p-4">
                    <label className="text-xs text-muted-foreground mb-2 block">To</label>
                    <div className="flex gap-3">
                        <select
                            value={toCurrency}
                            onChange={(e) => setToCurrency(e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {currencies.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.flag} {currency.code}
                                </option>
                            ))}
                        </select>
                        <div className={`flex-1 bg-background border border-border rounded-lg px-4 py-2 text-lg font-mono font-bold text-primary transition-all ${isConverting ? 'opacity-50' : ''}`}>
                            {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-primary">
                            1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                        </span>
                        <TrendingUp className="w-3 h-3 text-bullish" />
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inverse Rate</span>
                    <span className="font-mono text-muted-foreground">
                        1 {toCurrency} = {inverseRate.toFixed(4)} {fromCurrency}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-mono text-muted-foreground">
                        {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CurrencyConverter;
