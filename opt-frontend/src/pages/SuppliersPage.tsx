import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierApi } from "@/api/supplierApi";
import type { Supplier, SupplierRequest } from "@/types/inventory-opt/supplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
      toast.success("Đã cập nhật trạng thái thành vô hiệu");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: supplierApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nhà cung cấp</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin nhà cung cấp và mặt hàng cung ứng
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm NCC
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã, tên, người liên hệ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showInactive ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? "Ẩn vô hiệu" : "Hiện vô hiệu"}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NCC</TableHead>
              <TableHead>Tên nhà cung cấp</TableHead>
              <TableHead>Người liên hệ</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không có nhà cung cấp nào
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className={cn(!s.isActive && "opacity-60")}
                >
                  <TableCell className="font-mono font-medium">
                    {s.supplierCode}
                  </TableCell>
                  <TableCell className="font-medium">
                    {s.supplierName}
                  </TableCell>
                  <TableCell>{s.contactPerson}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.isActive ? "default" : "secondary"}
                      className={cn(
                        s.isActive
                          ? "bg-status-success text-primary-foreground"
                          : "",
                      )}
                    >
                      {s.isActive ? "Hoạt động" : "Vô hiệu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        title="Sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          s.isActive
                            ? deactivateMut.mutate(s.id)
                            : activateMut.mutate(s.id);
                        }}
                        title={s.isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}
                      >
                        {s.isActive ? (
                          <PowerOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Power className="h-4 w-4 text-status-success" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/suppliers/${s.id}`)}
                        title="Xem mặt hàng"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {editingId ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>
                Mã NCC <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.supplierCode}
                onChange={(e) => setField("supplierCode", e.target.value)}
                placeholder="VD: NCC001"
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Tên nhà cung cấp <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.supplierName}
                onChange={(e) => setField("supplierName", e.target.value)}
                placeholder="Tên đầy đủ..."
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Địa chỉ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Người liên hệ</Label>
              <Input
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SĐT</Label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
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
              {editingId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
