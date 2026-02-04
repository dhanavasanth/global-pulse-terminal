import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AngelOneAuthProvider } from "@/contexts/AngelOneAuthContext";
import Index from "./pages/Index";
import OptionsLab from "./pages/OptionsLab";
import OrderFlow from "./pages/OrderFlow";
import NotFound from "./pages/NotFound";

import GlobalDashboard from "./pages/GlobalDashboard";

const queryClient = new QueryClient();

const App = () => (
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AngelOneAuthProvider>
  </QueryClientProvider>
);

export default App;
