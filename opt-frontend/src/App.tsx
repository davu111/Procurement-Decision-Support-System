import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
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
import AccessControlDebugPage from "@/pages/AccessControlDebugPage";
import NotFound from "@/pages/NotFound";
import { Loader, Lock } from "lucide-react";
import { canAccessRoute } from "@/config/roleAccess";

const queryClient = new QueryClient();

// Route Guard Component
const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userRole = roles?.[0] || null;
  const hasAccess = canAccessRoute(userRole, location.pathname);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <Lock className="h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này</p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

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

  return <RouteGuard>{children}</RouteGuard>;
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
                    <Route
                      path="/debug/access-control"
                      element={<AccessControlDebugPage />}
                    />
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
