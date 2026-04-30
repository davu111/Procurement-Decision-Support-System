import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Search,
  Warehouse as WarehouseIcon,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Eye,
  Trash2,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  warehouseApi,
  inventoryTransferApi,
  transactionApi,
  fileApi,
} from "@/api/warehouseApi";
import { productApi, type ProductLite } from "@/api/productApi";
import type {
  FullWarehouse,
  WorkType,
  InOutDetailRequest,
} from "@/types/warehouse/warehouse";
import { formatDate, formatNumber } from "@/utils/helpers";

const warehouseSchema = z.object({
  warehouseName: z
    .string()
    .trim()
    .nonempty({ message: "Tên kho không được trống" })
    .max(100, { message: "Tên kho tối đa 100 ký tự" }),
});

type ProductLine = { productId: string; quantity: string };

export default function WarehousesPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<FullWarehouse[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // CRUD dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FullWarehouse | null>(null);
  const [form, setForm] = useState({ warehouseName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Toggle active confirmation
  const [confirmTarget, setConfirmTarget] = useState<FullWarehouse | null>(
    null,
  );
  const [toggling, setToggling] = useState(false);

  // Transfer dialog (import/export)
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState<WorkType>("IMPORT");
  const [transferWarehouse, setTransferWarehouse] =
    useState<FullWarehouse | null>(null);
  const [lines, setLines] = useState<ProductLine[]>([
    { productId: "", quantity: "" },
  ]);
  const [transferring, setTransferring] = useState(false);
  // Report (docx) dialog
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportType, setReportType] = useState<WorkType>("IMPORT");
  const [reportViewUrl, setReportViewUrl] = useState<string | null>(null);
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(
    null,
  );

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const data = await warehouseApi.getFullInfo();
      console.log("Loaded warehouses:", data);
      setWarehouses(data ?? []);
      if (!selectedId && data?.length) setSelectedId(data[0].id);
    } catch (e) {
      toast({
        title: "Lỗi tải kho",
        description:
          e instanceof Error ? e.message : "Không thể tải danh sách kho",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productApi.getAll();
      setProducts(data ?? []);
    } catch {
      // optional
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      warehouses.filter((w) =>
        w.warehouseName?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [warehouses, search],
  );

  const selected = useMemo(
    () => warehouses.find((w) => w.id === selectedId) ?? null,
    [warehouses, selectedId],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ warehouseName: "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (w: FullWarehouse) => {
    setEditing(w);
    setForm({ warehouseName: w.warehouseName });
    setErrors({});
    setDialogOpen(true);
  };

  const submit = async () => {
    const parsed = warehouseSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload = { warehouseName: parsed.data.warehouseName };
      if (editing) {
        await warehouseApi.update(editing.id, payload);
        toast({ title: "Cập nhật kho thành công" });
      } else {
        await warehouseApi.create(payload);
        toast({ title: "Tạo kho mới thành công" });
      }
      setDialogOpen(false);
      await loadWarehouses();
    } catch (e) {
      toast({
        title: "Lỗi lưu kho",
        description: e instanceof Error ? e.message : "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async () => {
    if (!confirmTarget) return;
    setToggling(true);
    try {
      const active = confirmTarget.isActive;
      if (active) await warehouseApi.deactivate(confirmTarget.id);
      else await warehouseApi.activate(confirmTarget.id);
      toast({
        title: active ? "Đã vô hiệu hóa kho" : "Đã kích hoạt kho",
      });
      setConfirmTarget(null);
      await loadWarehouses();
    } catch (e) {
      toast({
        title: "Lỗi đổi trạng thái",
        description: e instanceof Error ? e.message : "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  const openTransfer = (w: FullWarehouse, type: WorkType) => {
    setTransferWarehouse(w);
    setTransferType(type);
    setLines([{ productId: "", quantity: "" }]);
    setTransferOpen(true);
  };

  const updateLine = (idx: number, patch: Partial<ProductLine>) => {
    setLines((cur) => cur.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () =>
    setLines((cur) => [...cur, { productId: "", quantity: "" }]);
  const removeLine = (idx: number) =>
    setLines((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== idx) : cur));

  const submitTransfer = async () => {
    if (!transferWarehouse) return;
    const productQuantities: Record<string, number> = {};
    const inOutDetails: InOutDetailRequest[] = [];
    const seen = new Set<string>();
    for (const l of lines) {
      const pid = l.productId.trim();
      const qty = Number(l.quantity);
      if (!pid || !qty || qty <= 0) {
        toast({
          title: "Dữ liệu không hợp lệ",
          description: "Mỗi dòng phải có sản phẩm và số lượng > 0",
          variant: "destructive",
        });
        return;
      }
      productQuantities[pid] = qty;
      inOutDetails.push({ productId: pid, quantity: qty });
    }
    setTransferring(true);
    try {
      await inventoryTransferApi.transfer({
        warehouseId: transferWarehouse.id,
        workType: transferType,
        productQuantities,
      });
      const tx = transactionApi.create({
        warehouseId: transferWarehouse.id,
        workType: transferType,
        inOutDetails,
      });
      toast({
        title:
          transferType === "IMPORT"
            ? "Nhập hàng thành công"
            : "Xuất hàng thành công",
      });
      // 2. Đóng dialog nhập, mở dialog xem phiếu + bắt đầu generate
      const currentType = transferType;
      setTransferOpen(false);
      setReportType(currentType);
      setReportViewUrl(null);
      setReportDownloadUrl(null);
      setReportOpen(true);
      setReportLoading(true);
      try {
        // 3. Generate report -> fileId
        const fileId = await transactionApi.generateReport(
          String((await tx).id),
        );
        // 4. Lấy URL view + download song song
        const [viewUrl, downloadUrl] = await Promise.all([
          fileApi.getViewUrl(fileId),
          fileApi.getDownloadUrl(fileId),
        ]);
        setReportViewUrl(viewUrl);
        setReportDownloadUrl(downloadUrl);
      } catch (e) {
        toast({
          title: "Lỗi tạo phiếu",
          description:
            e instanceof Error ? e.message : "Không thể tạo phiếu nhập/xuất",
          variant: "destructive",
        });
      } finally {
        setReportLoading(false);
      }

      await loadWarehouses();
    } catch (e) {
      toast({
        title: "Lỗi giao dịch kho",
        description: e instanceof Error ? e.message : "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const totalActive = warehouses.filter((w) => w.isActive).length;
  const totalInventoryAll = warehouses.reduce(
    (s, w) => s + Number(w.totalInventory ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý Kho hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            Thêm/sửa kho, theo dõi tồn kho và thực hiện nhập/xuất hàng
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm kho mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tổng số kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tổng tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalInventoryAll)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kho theo tên..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" />
            Danh sách kho
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có kho nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên kho</TableHead>
                  <TableHead className="text-right">Số mặt hàng</TableHead>
                  <TableHead className="text-right">Tổng tồn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => {
                  const active = w.isActive;
                  return (
                    <TableRow
                      key={w.id}
                      data-state={selectedId === w.id ? "selected" : undefined}
                    >
                      <TableCell className="font-medium">
                        {w.warehouseName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(Number(w.totalInventory ?? 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(Number(w.items ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={active ? "default" : "secondary"}>
                          {active ? "Hoạt động" : "Vô hiệu hóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Xem tồn kho"
                            onClick={() => setSelectedId(w.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Nhập hàng"
                            disabled={!active}
                            onClick={() => openTransfer(w, "IMPORT")}
                          >
                            <ArrowDownToLine className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Xuất hàng"
                            disabled={!active}
                            onClick={() => openTransfer(w, "EXPORT")}
                          >
                            <ArrowUpFromLine className="h-4 w-4 text-warning" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Sửa"
                            onClick={() => openEdit(w)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={active ? "Vô hiệu hóa" : "Kích hoạt"}
                            onClick={() => setConfirmTarget(w)}
                          >
                            {active ? (
                              <PowerOff className="h-4 w-4 text-destructive" />
                            ) : (
                              <Power className="h-4 w-4 text-success" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inventory detail of selected warehouse */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Tồn kho — {selected.warehouseName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected.inventories?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã SP</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Cập nhật cuối</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.inventories.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">
                        {inv.productId}
                      </TableCell>
                      <TableCell>{inv.productName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(Number(inv.quantity ?? 0))}
                      </TableCell>
                      <TableCell>{inv.unit}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.lastUpdated ? formatDate(inv.lastUpdated) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Kho này chưa có hàng
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa thông tin kho" : "Thêm kho mới"}
            </DialogTitle>
            <DialogDescription>Nhập tên kho rồi nhấn Lưu</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Tên kho</Label>
              <Input
                value={form.warehouseName}
                onChange={(e) => setForm({ warehouseName: e.target.value })}
                placeholder="VD: Kho trung tâm"
              />
              {errors.warehouseName && (
                <p className="text-sm text-destructive">
                  {errors.warehouseName}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate confirmation */}
      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget && confirmTarget.isActive
                ? "Vô hiệu hóa kho?"
                : "Kích hoạt kho?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.warehouseName} sẽ{" "}
              {confirmTarget && confirmTarget.isActive
                ? "không thể nhập/xuất hàng cho đến khi được kích hoạt lại"
                : "có thể tiếp tục nhập/xuất hàng"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={toggleActive} disabled={toggling}>
              {toggling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer (import/export) dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {transferType === "IMPORT"
                ? "Nhập hàng vào kho"
                : "Xuất hàng khỏi kho"}
              {transferWarehouse ? ` — ${transferWarehouse.warehouseName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Chọn sản phẩm và nhập số lượng. Có thể thêm nhiều dòng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1">
                  {products.length > 0 ? (
                    <Select
                      value={line.productId}
                      onValueChange={(v) => updateLine(idx, { productId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn sản phẩm" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            {p.productName ?? p.name ?? `SP #${p.id}`}
                            {(p.productCode ?? p.code)
                              ? ` (${p.productCode ?? p.code})`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Mã sản phẩm"
                      value={line.productId}
                      onChange={(e) =>
                        updateLine(idx, { productId: e.target.value })
                      }
                    />
                  )}
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="w-32"
                  placeholder="Số lượng"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(idx, { quantity: e.target.value })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" /> Thêm dòng
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(false)}
              disabled={transferring}
            >
              Hủy
            </Button>
            <Button onClick={submitTransfer} disabled={transferring}>
              {transferring && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {transferType === "IMPORT" ? "Nhập hàng" : "Xuất hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Report (docx) preview dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {reportType === "IMPORT" ? "Phiếu nhập hàng" : "Phiếu xuất hàng"}
            </DialogTitle>
            <DialogDescription>
              Xem trước file phiếu (.pdf) vừa được tạo. Bạn có thể tải về máy.
            </DialogDescription>
          </DialogHeader>
          <div className="h-[65vh] w-full border rounded-md overflow-hidden bg-muted/30">
            {reportLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Đang tạo phiếu...</p>
              </div>
            ) : reportViewUrl ? (
              <iframe
                title="Phiếu nhập/xuất"
                src={reportViewUrl}
                className="h-full w-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Không có dữ liệu phiếu
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Đóng
            </Button>
            <Button
              disabled={!reportDownloadUrl}
              onClick={() => {
                if (reportDownloadUrl) window.open(reportDownloadUrl, "_blank");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Tải xuống .pdf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
