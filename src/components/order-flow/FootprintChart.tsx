/**
 * FootprintChart - Wrapper for OrderflowChart
 * Maintains backward compatibility while using new delta-based rendering
 */

import { OrderflowChart } from "../Orderflow";
import { useOrderFlow } from "@/contexts/OrderFlowContext";

const FootprintChart = () => {
    const { symbol } = useOrderFlow();

    return (
        <div className="w-full h-full">
            <OrderflowChart
                symbol={symbol || 'BTCUSDT'}
                showVolumeProfile={true}
            />
        </div>
    );
};

export default FootprintChart;
