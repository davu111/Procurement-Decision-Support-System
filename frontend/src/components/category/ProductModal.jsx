import { useState, useEffect } from "react";
import {
  productCategories,
  productUnits,
} from "@/data/mockProductCategoryData";
import { mockWarehouses } from "@/data/mockWarehouseCategoryData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "Khác",
    unit: "Cái",
    warehouseId: "",
    description: "",
    minStock: 0,
    maxStock: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        category: product.category,
        unit: product.unit,
        warehouseId: product.warehouseId,
        description: product.description || "",
        minStock: product.minStock || 0,
        maxStock: product.maxStock || 0,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        category: "Khác",
        unit: "Cái",
        warehouseId: mockWarehouses[0]?.id || "",
        description: "",
        minStock: 0,
        maxStock: 0,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: product?.id || "",
      ...formData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product ? "Sửa thông tin hàng hóa" : "Thêm hàng hóa mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã hàng *</Label>
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
                placeholder="VD: SP-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên hàng hóa *</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chủng loại *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Đơn vị tính *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kho lưu trữ *</Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) =>
                setFormData({ ...formData, warehouseId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kho" />
              </SelectTrigger>
              <SelectContent>
                {mockWarehouses
                  .filter((wh) => wh.status === "active")
                  .map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStock">Tồn kho tối thiểu</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStock: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Tồn kho tối đa</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStock: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả chi tiết về hàng hóa..."
              rows={3}
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
