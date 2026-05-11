import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import KeycloakService from "@/api/KeycloakService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    // Nếu đã đăng nhập, chuyển đến dashboard
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    setIsLoginLoading(true);
    KeycloakService.getInstance().login();
    // Note: Sau khi login thành công, user sẽ được redirect về trang này
    // và AuthContext sẽ cập nhật isAuthenticated = true
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-white">📦</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-gray-900">
            Optimization
          </h1>
          <p className="text-gray-500">Hệ thống quản lý tối ưu hóa kho hàng</p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                Quản lý hàng tồn kho
              </p>
              <p className="text-xs text-gray-500">
                Theo dõi và quản lý tự động
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                Dự báo nhu cầu
              </p>
              <p className="text-xs text-gray-500">Thuật toán AI tiên tiến</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-emerald-600 text-xs font-bold">✓</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                Báo cáo chi tiết
              </p>
              <p className="text-xs text-gray-500">
                Phân tích dữ liệu toàn diện
              </p>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleLogin}
            disabled={isLoginLoading}
            className="w-full h-11 text-base font-semibold rounded-xl"
          >
            {isLoginLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Đang chuyển hướng...
              </>
            ) : (
              "Đăng nhập với Keycloak"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Sử dụng tài khoản Keycloak của bạn để đăng nhập
          </p>
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 text-center">
            © 2026 Inventory Optimization. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
