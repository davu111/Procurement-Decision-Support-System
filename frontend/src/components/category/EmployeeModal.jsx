import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EmployeeModal({ isOpen, onClose, onSave, employee }) {
  const [formData, setFormData] = useState({
    fullName: "",
    position: "",
    department: "",
    username: "",
    role: "staff",
    safetyStatus: "pending",
    warehouseStatus: "outside",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName,
        position: employee.position,
        department: employee.department,
        username: employee.username,
        role: employee.role,
        safetyStatus: employee.safetyStatus,
        warehouseStatus: employee.warehouseStatus,
      });
    } else {
      setFormData({
        fullName: "",
        position: "",
        department: "",
        username: "",
        role: "staff",
        safetyStatus: "pending",
        warehouseStatus: "outside",
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: employee?.id || "",
      ...formData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ tên *</Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Chức vụ *</Label>
              <Input
                id="position"
                required
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Phòng ban *</Label>
              <Input
                id="department"
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Tài khoản đăng nhập *</Label>
            <Input
              id="username"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Phân quyền</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Nhân viên</SelectItem>
                <SelectItem value="manager">Quản lý</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái bảo hộ LĐ</Label>
              <Select
                value={formData.safetyStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, safetyStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliant">Đạt yêu cầu</SelectItem>
                  <SelectItem value="non-compliant">Không đạt</SelectItem>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái kho</Label>
              <Select
                value={formData.warehouseStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, warehouseStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside">Trong kho</SelectItem>
                  <SelectItem value="outside">Ngoài kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{employee ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
