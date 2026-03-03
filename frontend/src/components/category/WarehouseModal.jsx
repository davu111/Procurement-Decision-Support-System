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

const parentWarehouses = ["Kho Tổng Bắc", "Kho Tổng Nam", "Kho Tổng Trung"];

export function WarehouseModal({ isOpen, onClose, onSave, warehouse }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parentWarehouse: "Kho Tổng Bắc",
    location: "",
    status: "active",
    capacity: 0,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        parentWarehouse: warehouse.parentWarehouse,
        location: warehouse.location,
        status: warehouse.status,
        capacity: warehouse.capacity,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        parentWarehouse: "Kho Tổng Bắc",
        location: "",
        status: "active",
        capacity: 0,
      });
    }
  }, [warehouse, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: warehouse?.id || "",
      currentStock: warehouse?.currentStock || 0,
      ...formData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {warehouse ? "Sửa thông tin kho" : "Thêm kho mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã kho *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VD: KHO-A1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên kho *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Thuộc Kho Tổng</Label>
            <Select
              value={formData.parentWarehouse}
              onValueChange={(value) =>
                setFormData({ ...formData, parentWarehouse: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parentWarehouses.map((pw) => (
                  <SelectItem key={pw} value={pw}>
                    {pw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Vị trí</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="VD: Tầng 1, Khu A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Sức chứa tối đa</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  <SelectItem value="maintenance">Đang bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {warehouse && (
            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              <strong>Tồn kho hiện tại:</strong> {warehouse.currentStock} (Không
              thể chỉnh sửa trực tiếp)
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{warehouse ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
