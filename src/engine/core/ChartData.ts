
import { FootprintCandle } from "@/contexts/OrderFlowContext";

// Simple container for data passed to layers
export interface ChartData {
    candles: FootprintCandle[];
}
