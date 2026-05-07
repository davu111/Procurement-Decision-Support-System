import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi, supplierProductApi } from "@/api/supplierApi";
import type {
  SupplierProduct,
  SupplierProductRequest,
} from "@/types/inventory-opt/supplier";
import ProductSelector from "@/components/product/ProductSelector";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Pencil,
  PowerOff,
  Power,
  Truck,
  Package,
  MapPin,
  Mail,
  Phone,
  User,
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
      toast.success("Đã vô hiệu hóa mặt hàng");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: supplierProductApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-products", supplierId] });
      toast.success("Đã kích hoạt mặt hàng");
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/suppliers")}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display text-gray-900 truncate">
              {supplier?.supplierName || "Nhà cung cấp"}
            </h1>
            {supplier && (
              <span className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                supplier.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-gray-100 text-gray-400 border border-gray-200",
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  supplier.isActive ? "bg-emerald-500" : "bg-gray-300",
                )} />
                {supplier.isActive ? "Hoạt động" : "Vô hiệu"}
              </span>
            )}
          </div>
          {supplier && (
            <p className="text-sm text-gray-400 mt-0.5 ml-12">
              {supplier.supplierCode}
            </p>
          )}
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Thêm mặt hàng
        </Button>
      </div>

      {/* ── Supplier info cards ──────────────────────────────────────────────── */}
      {supplier && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: MapPin, label: "Địa chỉ", value: supplier.address || "—" },
            { icon: Mail, label: "Email", value: supplier.email || "—" },
            { icon: Phone, label: "SĐT", value: supplier.phone || "—" },
            { icon: User, label: "Người liên hệ", value: supplier.contactPerson || "—" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">
                  {item.label}
                </p>
              </div>
              <p className="font-medium text-gray-900 text-sm truncate">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Products table ───────────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-gray-900 text-sm">
              Mặt hàng cung ứng
            </span>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {products.length} mặt hàng
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Mặt hàng</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">K (SL/tháng)</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">A (chi phí đặt)</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">C (đơn giá)</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">L (ngày)</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Hiệu lực</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Trạng thái</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-gray-200" />
                    <p className="text-gray-400 text-sm">Chưa có mặt hàng nào</p>
                    <p className="text-gray-300 text-xs">Nhấn "Thêm mặt hàng" để bắt đầu</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow
                  key={p.id}
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors",
                    !p.isActive && "opacity-60",
                  )}
                >
                  <TableCell className="font-semibold text-gray-900">{p.productName}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-700">
                    {p.maxSupplyPerMonth.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-700">
                    {formatCurrency(p.fixedOrderCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-700">
                    {formatCurrency(p.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-700">
                    {p.committedLeadTimeDays}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{p.effectiveDate}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                      p.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200",
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        p.isActive ? "bg-emerald-500" : "bg-gray-300",
                      )} />
                      {p.isActive ? "Hiệu lực" : "Vô hiệu"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => openEdit(p)}
                        title="Sửa"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => p.isActive ? deactivateMut.mutate(p.id) : activateMut.mutate(p.id)}
                        title={p.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          p.isActive
                            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                        )}
                      >
                        {p.isActive
                          ? <PowerOff className="h-3.5 w-3.5" />
                          : <Power className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── Dialog: Add / Edit Product ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              {editingId ? "Sửa mặt hàng cung ứng" : "Thêm mặt hàng cung ứng"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Product selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Mặt hàng <span className="text-red-400">*</span>
              </Label>
              <ProductSelector
                mode="combobox"
                value={form.productId ? form.productId.toString() : ""}
                onChange={(v) => setField("productId", Number(v))}
                disabled={!!editingId}
              />
            </div>

            {/* Numeric params grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  K – Năng lực / tháng
                </Label>
                <Input
                  type="number"
                  value={form.maxSupplyPerMonth || ""}
                  onChange={(e) => setField("maxSupplyPerMonth", Number(e.target.value))}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  L – Lead time (ngày)
                </Label>
                <Input
                  type="number"
                  value={form.committedLeadTimeDays || ""}
                  onChange={(e) => setField("committedLeadTimeDays", Number(e.target.value))}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  A – Chi phí đặt hàng (VNĐ)
                </Label>
                <Input
                  type="number"
                  value={form.fixedOrderCost || ""}
                  onChange={(e) => setField("fixedOrderCost", Number(e.target.value))}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  C – Đơn giá (VNĐ)
                </Label>
                <Input
                  type="number"
                  value={form.unitPrice || ""}
                  onChange={(e) => setField("unitPrice", Number(e.target.value))}
                  className="rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Effective date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Ngày hiệu lực</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setField("effectiveDate", e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Ghi chú</Label>
              <Textarea
                value={form.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">Hủy</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMut.isPending || updateMut.isPending}
              className="rounded-xl"
            >
              {editingId ? "Cập nhật" : "Thêm mặt hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
