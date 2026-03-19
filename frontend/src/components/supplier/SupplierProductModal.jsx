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

export function SupplierProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    maxSupplyPerMonth: "",
    fixedOrderCost: "",
    unitPrice: "",
    committedLeadTimeDays: "",
    effectiveDate: "",
    notes: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        maxSupplyPerMonth: product.maxSupplyPerMonth || "",
        fixedOrderCost: product.fixedOrderCost || "",
        unitPrice: product.unitPrice || "",
        committedLeadTimeDays: product.committedLeadTimeDays || "",
        effectiveDate: product.effectiveDate || "",
        notes: product.notes || "",
      });
    } else {
      setFormData({
        maxSupplyPerMonth: "",
        fixedOrderCost: "",
        unitPrice: "",
        committedLeadTimeDays: "",
        effectiveDate: "",
        notes: "",
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: product?.id || "", ...formData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? "Cập nhật sản phẩm nhà cung cấp" : "Thêm sản phẩm mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxSupplyPerMonth">Cung cấp tối đa/tháng (K)</Label>
            <Input
              id="maxSupplyPerMonth"
              type="number"
              step="0.0001"
              value={formData.maxSupplyPerMonth}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxSupplyPerMonth: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fixedOrderCost">Chi phí cố định (A)</Label>
              <Input
                id="fixedOrderCost"
                type="number"
                step="0.0001"
                value={formData.fixedOrderCost}
                onChange={(e) =>
                  setFormData({ ...formData, fixedOrderCost: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Giá đơn vị (C)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.0001"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="committedLeadTimeDays">
                Thời gian cung cấp (ngày)
              </Label>
              <Input
                id="committedLeadTimeDays"
                type="number"
                value={formData.committedLeadTimeDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    committedLeadTimeDays: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Hiệu lực từ ngày</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">{product ? "Cập nhật" : "Thêm mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
