import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ProductsPage from "@/pages/product/ProductsPage";
import ProductCategoriesPage from "@/pages/product/ProductCategoriesPage";
import WarehousesPage from "@/pages/warehouse/WarehousePage";
import TransactionHistoryPage from "@/pages/transaction/TransactionHistoryPage";
import ProductDetail from "@/pages/ProductDetail";
import NewPlanPage from "@/pages/NewPlanPage";
import ConsumptionPage from "@/pages/ConsumptionPage";
import SuppliersPage from "@/pages/SuppliersPage";
import SupplierDetailPage from "@/pages/SupplierDetailPage";
import EmployeesPage from "@/pages/EmployeesPage";
import NotFound from "@/pages/NotFound";
import { Loader } from "lucide-react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route
                      path="/product-categories"
                      element={<ProductCategoriesPage />}
                    />
                    <Route path="/warehouses" element={<WarehousesPage />} />
                    <Route
                      path="/transactions"
                      element={<TransactionHistoryPage />}
                    />
                    <Route path="/new-plan" element={<NewPlanPage />} />
                    <Route path="/consumption" element={<ConsumptionPage />} />
                    <Route path="/suppliers" element={<SuppliersPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route
                      path="/suppliers/:id"
                      element={<SupplierDetailPage />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
