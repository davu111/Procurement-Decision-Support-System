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

export function SupplierModal({ isOpen, onClose, onSave, supplier }) {
  const [formData, setFormData] = useState({
    supplierCode: "",
    supplierName: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierCode: supplier.supplierCode || "",
        supplierName: supplier.supplierName || "",
        address: supplier.address || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
      });
    } else {
      setFormData({
        supplierCode: "",
        supplierName: "",
        address: "",
        contactPerson: "",
        phone: "",
        email: "",
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: supplier?.id || "", ...formData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierCode">Mã nhà cung cấp *</Label>
            <Input
              id="supplierCode"
              required
              value={formData.supplierCode}
              onChange={(e) =>
                setFormData({ ...formData, supplierCode: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierName">Tên nhà cung cấp *</Label>
            <Input
              id="supplierName"
              required
              value={formData.supplierName}
              onChange={(e) =>
                setFormData({ ...formData, supplierName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Người liên hệ</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{supplier ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
