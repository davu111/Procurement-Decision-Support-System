import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { employeeApi, EmployeeResponse } from "@/api/employeeApi";
import { useAuth } from "@/context/AuthContext";
import KeycloakService from "@/api/KeycloakService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

// Role name mapping to Vietnamese
const ROLE_NAME_MAP: Record<string, string> = {
  admin: "Quản trị viên",
  "planning-manager": "Quản lý kế hoạch",
  "warehouse-manager": "Quản lý kho hàng",
};

const getRoleDisplayName = (roleName?: string): string => {
  if (!roleName) return "Không xác định";
  return ROLE_NAME_MAP[roleName] || roleName;
};

// Status badge mapping
const STATUS_COLOR_MAP: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  INACTIVE: "destructive",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Không hoạt động",
};

export default function Profile() {
  const { userInfo, isLoading: authLoading } = useAuth();
  const keycloakService = KeycloakService.getInstance();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  const userId = userInfo?.sub || userInfo?.id;

  // Fetch employee data
  const {
    data: employee,
    isLoading: employeeLoading,
    refetch,
  } = useQuery({
    queryKey: ["employee", userId],
    queryFn: () =>
      userId ? employeeApi.getById(userId) : Promise.reject("No userId"),
    enabled: !!userId && !authLoading,
    retry: 1,
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      userId ? employeeApi.update(userId, data) : Promise.reject("No userId"),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Lỗi cập nhật thông tin");
    },
  });

  // Initialize form data when employee data loads
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
      });
    }
  }, [employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim()) {
      toast.error("Vui lòng nhập họ");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Vui lòng nhập tên");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
      });
    }
    setIsEditing(false);
  };

  if (authLoading || employeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md p-6 border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-900">Lỗi tải dữ liệu</h3>
          </div>
          <p className="text-sm text-red-800">
            Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý thông tin tài khoản của bạn
          </p>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Status */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {employee?.firstName?.charAt(0)}
                {employee?.lastName?.charAt(0)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {employee?.firstName} {employee?.lastName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{employee?.username}</p>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Vai trò
                </Label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {getRoleDisplayName(employee?.roleName)}
                </p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </Label>
                <Badge
                  variant={STATUS_COLOR_MAP[employee?.status || "ACTIVE"]}
                  className="ml-2 mt-2 inline-flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  {STATUS_LABEL_MAP[employee?.status || "ACTIVE"]}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Thông tin cá nhân
              </h2>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-900"
                  >
                    Họ *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ"
                    className="border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-900"
                  >
                    Tên *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên"
                    className="border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Display Mode - First Name */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Họ
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {employee?.firstName || "Không có dữ liệu"}
                    </p>
                  </div>
                </div>

                {/* Display Mode - Last Name */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {employee?.lastName || "Không có dữ liệu"}
                    </p>
                  </div>
                </div>

                {/* Display Mode - Username */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tên đăng nhập
                    </Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {employee?.username || "Không có dữ liệu"}
                    </p>
                  </div>
                </div>

                {/* Display Mode - Email (from Keycloak) */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {userInfo?.email || "Không có dữ liệu"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display Mode - Role Info */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vai trò & Quyền hạn
                      </Label>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {getRoleDisplayName(employee?.roleName)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Không thể thay đổi - liên hệ quản trị viên
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
