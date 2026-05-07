import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "@/api/supplierApi";
import type { Supplier, SupplierRequest } from "@/types/inventory-opt/supplier";
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
import {
  Plus,
  Pencil,
  PowerOff,
  Power,
  Search,
  Truck,
  ChevronRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const emptyForm: SupplierRequest = {
  supplierCode: "",
  supplierName: "",
  address: "",
  contactPerson: "",
  phone: "",
  email: "",
};

export default function SuppliersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierRequest>(emptyForm);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierApi.getAll,
  });

  const createMut = useMutation({
    mutationFn: supplierApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Tạo nhà cung cấp thành công");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: supplierApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Cập nhật thành công");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: supplierApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Đã vô hiệu hóa nhà cung cấp");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: supplierApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Đã kích hoạt nhà cung cấp");
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

  const openEdit = (s: Supplier) => {
    setForm({
      supplierCode: s.supplierCode,
      supplierName: s.supplierName,
      address: s.address,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
    });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.supplierCode.trim() || !form.supplierName.trim()) {
      toast.error("Mã và tên nhà cung cấp không được để trống");
      return;
    }
    if (editingId) {
      updateMut.mutate({ ...form, id: editingId });
    } else {
      createMut.mutate(form);
    }
  };

  const filtered = suppliers.filter((s) => {
    if (!showInactive && !s.isActive) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      s.supplierCode.toLowerCase().includes(q) ||
      s.supplierName.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q)
    );
  });

  const setField = (field: keyof SupplierRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">
              Nhà cung cấp
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {activeCount} đang hoạt động · {suppliers.length} tổng cộng
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm NCC
        </Button>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã, tên, người liên hệ..."
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
            {filtered.length} nhà cung cấp
          </span>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Mã NCC</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Tên nhà cung cấp</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Người liên hệ</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">SĐT</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Email</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Trạng thái</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-gray-200" />
                    <p className="text-gray-400 text-sm">Không có nhà cung cấp nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors",
                    !s.isActive && "opacity-60",
                  )}
                >
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                      {s.supplierCode}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    {s.supplierName}
                  </TableCell>
                  <TableCell className="text-gray-600">{s.contactPerson}</TableCell>
                  <TableCell className="text-gray-600 font-mono text-sm">{s.phone}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{s.email}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                      s.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200",
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        s.isActive ? "bg-emerald-500" : "bg-gray-300",
                      )} />
                      {s.isActive ? "Hoạt động" : "Vô hiệu"}
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
                        onClick={() => s.isActive ? deactivateMut.mutate(s.id) : activateMut.mutate(s.id)}
                        title={s.isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          s.isActive
                            ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                        )}
                      >
                        {s.isActive
                          ? <PowerOff className="h-3.5 w-3.5" />
                          : <Power className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => navigate(`/suppliers/${s.id}`)}
                        title="Xem mặt hàng"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── Dialog: Create / Edit ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              {editingId ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Row 1: code + name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Mã NCC <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.supplierCode}
                  onChange={(e) => setField("supplierCode", e.target.value)}
                  placeholder="VD: NCC001"
                  disabled={!!editingId}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Tên nhà cung cấp <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={form.supplierName}
                  onChange={(e) => setField("supplierName", e.target.value)}
                  placeholder="Tên đầy đủ..."
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Địa chỉ..."
                className="rounded-xl"
              />
            </div>

            {/* Row 3: contact + phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Người liên hệ</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setField("contactPerson", e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Số điện thoại</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">
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
    </div>
  );
}
