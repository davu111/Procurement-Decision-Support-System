import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeeApi,
  EmployeeRequest,
  EmployeeResponse,
} from "@/api/employeeApi";
import { roleApi } from "@/api/roleApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, PowerOff, Power, Search, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

// Roles to exclude from list
const EXCLUDED_ROLES = [
  "default-roles-optimization",
  "offline_access",
  "uma_authorization",
];

// Role name mapping to Vietnamese
const ROLE_NAME_MAP: Record<string, string> = {
  admin: "Quản trị viên",
  "planning-manager": "Quản lý kế hoạch",
  "warehouse-manager": "Quản lý kho hàng",
};

// Get display name for role
const getRoleDisplayName = (roleName: string): string => {
  return ROLE_NAME_MAP[roleName] || roleName;
};

// Filter and get available roles
const getAvailableRoles = (roles: any[]) => {
  return roles.filter((role) => !EXCLUDED_ROLES.includes(role.roleName));
};

const emptyForm: EmployeeRequest = {
  firstName: "",
  lastName: "",
  username: "",
  roleName: "",
  status: "ACTIVE",
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeRequest>(emptyForm);
  const [newEmployeeInfo, setNewEmployeeInfo] = useState<{
    username: string;
    initialPassword: string;
  } | null>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: employeeApi.getAll,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: roleApi.getAll,
  });

  const createMut = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      // Save new employee info to show in dialog
      if (data?.initialPassword) {
        setNewEmployeeInfo({
          username: data.username,
          initialPassword: data.initialPassword,
        });
      }
      closeDialog();
    },
    onError: (e: any) => toast.error(e?.message || "Lỗi"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeRequest }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: (e: any) => toast.error(e?.message || "Lỗi"),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => employeeApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Đã vô hiệu hóa nhân viên");
    },
    onError: (e: any) => toast.error(e?.message || "Lỗi"),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => employeeApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Đã kích hoạt nhân viên");
    },
    onError: (e: any) => toast.error(e?.message || "Lỗi"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (u: EmployeeResponse) => {
    setForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      username: u.username || "",
      roleName: u.roleName || "",
      status: (u.status as any) || "ACTIVE",
    });
    setEditingId(u.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.username.trim()) {
      toast.error("Họ và tên, username không được để trống");
      return;
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const filtered = employees.filter((s) => {
    if (!showInactive && s.status !== "ACTIVE") return false;
    const q = search.toLowerCase();
    return (
      !q ||
      (s.firstName || "").toLowerCase().includes(q) ||
      (s.lastName || "").toLowerCase().includes(q) ||
      (s.username || "").toLowerCase().includes(q) ||
      (s.roleName || "").toLowerCase().includes(q)
    );
  });

  const setField = (field: keyof EmployeeRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const activeCount = employees.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">
              Nhân viên
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {activeCount} đang hoạt động · {employees.length} tổng cộng
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm nhân viên
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo họ, tên, username, vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
            showInactive
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:border-primary/30 hover:text-primary",
          )}
        >
          {showInactive ? "Ẩn vô hiệu" : "Hiện vô hiệu"}
        </button>
        {filtered.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} nhân viên
          </span>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Họ tên
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Username
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Vai trò
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Trạng thái
              </TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-gray-200" />
                    <p className="text-gray-400 text-sm">
                      Không có nhân viên nào
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className={cn(
                    "hover:bg-gray-50/50",
                    s.status !== "ACTIVE" && "opacity-60",
                  )}
                >
                  <TableCell className="font-semibold text-gray-900">
                    {s.firstName} {s.lastName}
                  </TableCell>
                  <TableCell className="text-gray-600 font-mono text-sm">
                    {s.username}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {getRoleDisplayName(s.roleName)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                        s.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          s.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-gray-300",
                        )}
                      />
                      {s.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => openEdit(s)}
                        title="Sửa"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          s.status === "ACTIVE"
                            ? deactivateMut.mutate(s.id)
                            : activateMut.mutate(s.id)
                        }
                        title={
                          s.status === "ACTIVE"
                            ? "Vô hiệu hóa"
                            : "Kích hoạt lại"
                        }
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          s.status === "ACTIVE"
                            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                        )}
                      >
                        {s.status === "ACTIVE" ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              {editingId ? "Sửa nhân viên" : "Thêm nhân viên mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Họ
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Tên
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Username <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                className="rounded-xl"
                disabled={!!editingId}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Vai trò
                </Label>
                <Select
                  onValueChange={(v) => setField("roleName", v)}
                  value={form.roleName}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles(roles).map((role) => (
                      <SelectItem key={role.id} value={role.roleName}>
                        {getRoleDisplayName(role.roleName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Trạng thái
                </Label>
                <Select
                  onValueChange={(v) => setField("status", v)}
                  value={form.status}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue>{form.status}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Vô hiệu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              className="rounded-xl"
            >
              {editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hiển thị username và password sau khi tạo thành công */}
      <Dialog
        open={!!newEmployeeInfo}
        onOpenChange={(v) => {
          if (!v) setNewEmployeeInfo(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              Tạo nhân viên thành công
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
                  Username
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={newEmployeeInfo?.username || ""}
                    readOnly
                    className="rounded-lg bg-white"
                  />
                  <button
                    onClick={() => {
                      if (newEmployeeInfo?.username) {
                        navigator.clipboard.writeText(newEmployeeInfo.username);
                        toast.success("Đã sao chép");
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    Sao chép
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
                  Mật khẩu tạm thời
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={newEmployeeInfo?.initialPassword || ""}
                    readOnly
                    type="password"
                    className="rounded-lg bg-white"
                  />
                  <button
                    onClick={() => {
                      if (newEmployeeInfo?.initialPassword) {
                        navigator.clipboard.writeText(
                          newEmployeeInfo.initialPassword,
                        );
                        toast.success("Đã sao chép");
                      }
                    }}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    Sao chép
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-semibold mb-1">⚠️ Lưu ý quan trọng</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • Hãy gửi thông tin này cho nhân viên một cách an toàn
                  </li>
                  <li>• Nhân viên cần đổi mật khẩu khi đăng nhập lần đầu</li>
                  <li>• Đừng để lộ mật khẩu này nơi công cộng</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setNewEmployeeInfo(null);
                toast.success("Tạo nhân viên thành công");
              }}
              className="rounded-xl"
            >
              Xong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
