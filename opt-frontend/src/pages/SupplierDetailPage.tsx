import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi, supplierProductApi } from "@/api/supplierApi";
import type {
  SupplierProduct,
  SupplierProductRequest,
} from "@/types/inventory-opt/supplier";
import { mockProducts } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Pencil,
  PowerOff,
  Power,
  Truck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/helpers";
import { cn } from "@/lib/utils";

const emptyForm: SupplierProductRequest = {
  productId: 0,
  maxSupplyPerMonth: 0,
  fixedOrderCost: 0,
  unitPrice: 0,
  committedLeadTimeDays: 0,
  effectiveDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function SupplierDetailPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierProductRequest>(emptyForm);

  const { data: supplier } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => supplierApi.getById(supplierId!),
    enabled: !!supplierId,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["supplier-products", supplierId],
    queryFn: () => supplierProductApi.getBySupplierId(supplierId!),
    enabled: !!supplierId,
  });

  const createMut = useMutation({
    mutationFn: (data: SupplierProductRequest) =>
      supplierProductApi.create(supplierId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast.success("Thêm mặt hàng thành công");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: SupplierProductRequest & { id: string }) =>
      supplierProductApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: supplierProductApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast.success("Đã cập nhật trạng thái thành vô hiệu");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: supplierProductApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast.success("Đã cập nhật trạng thái thành hiệu lực");
    },
    onError: (e: Error) => toast.error(e.message),
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

  const openEdit = (p: SupplierProduct) => {
    setForm({
      productId: p.productId,
      maxSupplyPerMonth: p.maxSupplyPerMonth,
      fixedOrderCost: p.fixedOrderCost,
      unitPrice: p.unitPrice,
      committedLeadTimeDays: p.committedLeadTimeDays,
      effectiveDate: p.effectiveDate,
      notes: p.notes || "",
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.productId) {
      toast.error("Vui lòng chọn mặt hàng");
      return;
    }
    if (editingId) {
      updateMut.mutate({ ...form, id: editingId });
    } else {
      createMut.mutate(form);
    }
  };

  const setField = <K extends keyof SupplierProductRequest>(
    field: K,
    value: SupplierProductRequest[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/suppliers")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {supplier?.supplierName || "Nhà cung cấp"}
            </h1>
            {supplier && (
              <Badge
                variant={supplier.isActive ? "default" : "secondary"}
                className={cn(
                  supplier.isActive
                    ? "bg-status-success text-primary-foreground"
                    : "",
                )}
              >
                {supplier.isActive ? "Hoạt động" : "Vô hiệu"}
              </Badge>
            )}
          </div>
          {supplier && (
            <p className="text-muted-foreground mt-1">
              Mã: {supplier.supplierCode} · {supplier.contactPerson} ·{" "}
              {supplier.phone}
            </p>
          )}
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm mặt hàng
        </Button>
      </div>

      {/* Supplier info summary */}
      {supplier && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Địa chỉ", value: supplier.address || "—" },
            { label: "Email", value: supplier.email || "—" },
            { label: "SĐT", value: supplier.phone || "—" },
            { label: "Người liên hệ", value: supplier.contactPerson || "—" },
          ].map((item) => (
            <div key={item.label} className="bg-muted rounded-md p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-medium text-foreground text-sm truncate">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Products table */}
      <div className="bg-card border rounded-lg">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            Mặt hàng cung ứng
          </span>
          <Badge variant="secondary" className="ml-auto">
            {products.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mặt hàng</TableHead>
              <TableHead className="text-right">K (năng lực/tháng)</TableHead>
              <TableHead className="text-right">A (chi phí đặt)</TableHead>
              <TableHead className="text-right">C (đơn giá)</TableHead>
              <TableHead className="text-right">L (ngày)</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có mặt hàng nào
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow
                  key={p.id}
                  className={cn(!p.isActive && "opacity-60")}
                >
                  <TableCell className="font-medium">{p.productName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {p.maxSupplyPerMonth.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(p.fixedOrderCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(p.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {p.committedLeadTimeDays}
                  </TableCell>
                  <TableCell>{p.effectiveDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.isActive ? "default" : "secondary"}
                      className={cn(
                        p.isActive
                          ? "bg-status-success text-primary-foreground"
                          : "",
                      )}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          p.isActive
                            ? deactivateMut.mutate(p.id)
                            : activateMut.mutate(p.id);
                        }}
                      >
                        {p.isActive ? (
                          <PowerOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Power className="h-4 w-4 text-status-success" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Product Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Sửa mặt hàng cung ứng" : "Thêm mặt hàng cung ứng"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2 col-span-2">
              <Label>
                Mặt hàng <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.productId ? form.productId.toString() : ""}
                onValueChange={(v) => setField("productId", Number(v))}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn mặt hàng..." />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.code} – {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>K – Năng lực cung cấp / tháng</Label>
              <Input
                type="number"
                value={form.maxSupplyPerMonth || ""}
                onChange={(e) =>
                  setField("maxSupplyPerMonth", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>A – Chi phí đặt hàng (VNĐ)</Label>
              <Input
                type="number"
                value={form.fixedOrderCost || ""}
                onChange={(e) =>
                  setField("fixedOrderCost", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>C – Đơn giá (VNĐ)</Label>
              <Input
                type="number"
                value={form.unitPrice || ""}
                onChange={(e) => setField("unitPrice", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>L – Lead time (ngày)</Label>
              <Input
                type="number"
                value={form.committedLeadTimeDays || ""}
                onChange={(e) =>
                  setField("committedLeadTimeDays", Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày hiệu lực</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setField("effectiveDate", e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
