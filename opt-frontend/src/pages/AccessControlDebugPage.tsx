import { useAuth } from "@/context/AuthContext";
import { getAccessibleRoutes } from "@/config/roleAccess";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessControlDebugPage() {
  const navigate = useNavigate();
  const { userInfo, roles, isLoading } = useAuth();

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  const userRole = roles?.[0] || null;
  const accessibleRoutes = getAccessibleRoutes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold font-display">
          Debug - Access Control
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* User Info Card */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Thông tin người dùng</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-500">Tên:</p>
              <p className="font-semibold">{userInfo?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Email:</p>
              <p className="font-semibold">{userInfo?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Username:</p>
              <p className="font-semibold">
                {userInfo?.preferred_username || "N/A"}
              </p>
            </div>
          </div>
        </Card>

        {/* Roles Card */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Vai trò</h2>
          {roles && roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map((role, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700"
                >
                  {role}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Không có vai trò</p>
          )}
        </Card>
      </div>

      {/* Accessible Routes */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">
          Các trang được phép truy cập ({accessibleRoutes.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accessibleRoutes.length > 0 ? (
            accessibleRoutes.map((route) => (
              <div
                key={route.path}
                className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <p className="font-semibold text-emerald-900">{route.label}</p>
                <p className="text-xs text-emerald-700 font-mono">
                  {route.path}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Không có trang được phép</p>
          )}
        </div>
      </Card>

      {/* Token Info */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Thông tin Token</h2>
        <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-48">
          <pre className="text-xs text-gray-700">
            {JSON.stringify(
              {
                userInfo,
                roles,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </Card>

      <Button
        onClick={() => (window.location.href = "/dashboard")}
        className="w-full"
      >
        Về Dashboard
      </Button>
    </div>
  );
}
