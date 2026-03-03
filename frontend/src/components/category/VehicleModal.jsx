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

export function VehicleModal({ isOpen, onClose, onSave, vehicle }) {
  const [formData, setFormData] = useState({
    name: "",
    licensePlate: "",
    type: "truck",
    status: "available",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        type: vehicle.type,
        status: vehicle.status,
      });
    } else {
      setFormData({
        name: "",
        licensePlate: "",
        type: "truck",
        status: "available",
      });
    }
  }, [vehicle, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: vehicle?.id || "",
      ...formData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Sửa thông tin phương tiện" : "Thêm phương tiện mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên xe *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">Biển số *</Label>
            <Input
              id="licensePlate"
              required
              value={formData.licensePlate}
              onChange={(e) =>
                setFormData({ ...formData, licensePlate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Loại phương tiện</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="truck">Xe tải</SelectItem>
                <SelectItem value="forklift">Xe nâng</SelectItem>
                <SelectItem value="van">Xe van</SelectItem>
                <SelectItem value="motorcycle">Xe máy</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="available">Sẵn sàng</SelectItem>
                <SelectItem value="in-use">Đang sử dụng</SelectItem>
                <SelectItem value="maintenance">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{vehicle ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
