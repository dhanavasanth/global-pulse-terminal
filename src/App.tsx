import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AngelOneAuthProvider } from "@/contexts/AngelOneAuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import OptionsLab from "./pages/OptionsLab";
import OrderFlow from "./pages/OrderFlow";
import NotFound from "./pages/NotFound";
import GlobalDashboard from "./pages/GlobalDashboard";
import StockAtlas from "./pages/StockAtlas";
import Screener from "./pages/Screener";
import AutoTrade from "./pages/AutoTrade";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AngelOneAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/options-lab" element={<OptionsLab />} />
              <Route path="/order-flow" element={<OrderFlow />} />
              <Route path="/market-dashboard" element={<GlobalDashboard />} />
              <Route path="/stock-atlas" element={<StockAtlas />} />
              <Route path="/screener" element={<Screener />} />
              <Route path="/autotrade" element={<AutoTrade />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AngelOneAuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
