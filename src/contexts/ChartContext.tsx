import { createContext, useContext, useState, ReactNode } from "react";

interface ChartContextType {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  symbolName: string;
  setSymbolName: (name: string) => void;
}

const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider = ({ children }: { children: ReactNode }) => {
  const [selectedSymbol, setSelectedSymbol] = useState("NASDAQ:AAPL");
  const [symbolName, setSymbolName] = useState("Apple Inc.");

  return (
    <ChartContext.Provider value={{ selectedSymbol, setSelectedSymbol, symbolName, setSymbolName }}>
      {children}
    </ChartContext.Provider>
  );
};

export const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within ChartProvider");
  }
  return context;
};
