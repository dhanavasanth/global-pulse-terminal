
import { useOrderFlow, FootprintCandle } from "@/contexts/OrderFlowContext";
import ChartCanvas from "../chart/ChartCanvas";

const FootprintChart = () => {
    const { candles, currentCandle, lastPrice, imbalanceRatio } = useOrderFlow();

    // Merge history + current
    const allCandles = [...candles];
    if (currentCandle) {
        allCandles.push(currentCandle);
    }

    return (
        <div className="w-full h-full">
            <ChartCanvas
                candles={allCandles}
                lastPrice={lastPrice}
                imbalanceRatio={imbalanceRatio}
            />
        </div>
    );
};

export default FootprintChart;

