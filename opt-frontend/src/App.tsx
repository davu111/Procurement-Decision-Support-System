import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import HeatmapPage from "@/pages/HeatmapPage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetail from "@/pages/ProductDetail";
import NewPlanPage from "@/pages/NewPlanPage";
import ConsumptionPage from "@/pages/ConsumptionPage";
import SettingsPage from "@/pages/SettingsPage";
import ForecastPage from "@/pages/ForecastPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/new-plan" element={<NewPlanPage />} />
            <Route path="/consumption" element={<ConsumptionPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
