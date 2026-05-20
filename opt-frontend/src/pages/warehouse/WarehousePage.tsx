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
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import ProductSelector from "@/components/product/ProductSelector";
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

const warehouseConfigSchema = z.object({
  interestRate: z.number().min(0, { message: "Lãi suất phải >= 0" }),
  warehouseMonthlyCost: z.number().min(0, { message: "Chi phí kho phải >= 0" }),
  warehouseMaxCapacity: z
    .number()
    .min(0.0001, { message: "Sức chứa tối đa phải > 0" }),
  spoilageRate: z.number().min(0, { message: "Tỉ lệ hao hụt phải >= 0" }),
  insuranceRate: z.number().min(0, { message: "Tỉ lệ bảo hiểm phải >= 0" }),
});

const warehouseSchema = z.object({
  warehouseName: z
    .string()
    .trim()
    .nonempty({ message: "Tên kho không được trống" })
    .max(100, { message: "Tên kho tối đa 100 ký tự" }),
  warehouseConfigRequest: warehouseConfigSchema,
});

type ProductLine = { productId: string; quantity: string };

interface WarehouseForm {
  warehouseName: string;
  interestRate: string;
  warehouseMonthlyCost: string;
  warehouseMaxCapacity: string;
  spoilageRate: string;
  insuranceRate: string;
  storageCostCoefficient: string;
}

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
  const [form, setForm] = useState<WarehouseForm>({
    warehouseName: "",
    interestRate: "",
    warehouseMonthlyCost: "",
    warehouseMaxCapacity: "",
    spoilageRate: "",
    insuranceRate: "",
    storageCostCoefficient: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

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
    setForm({
      warehouseName: "",
      interestRate: "",
      warehouseMonthlyCost: "",
      warehouseMaxCapacity: "",
      spoilageRate: "",
      insuranceRate: "",
      storageCostCoefficient: "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (w: FullWarehouse) => {
    setEditing(w);
    setForm({
      warehouseName: w.warehouseName,
      interestRate: "",
      warehouseMonthlyCost: "",
      warehouseMaxCapacity: "",
      spoilageRate: "",
      insuranceRate: "",
      storageCostCoefficient: "",
    });
    setErrors({});
    setDialogOpen(true);

    // Load warehouse config if configId exists
    console.log("Warehouse selected: ", w);
    if (w.configId) {
      loadWarehouseConfig(w.configId);
    }
  };

  const loadWarehouseConfig = async (configId: number) => {
    setLoadingConfig(true);
    try {
      const config = await warehouseApi.getConfigById(configId);
      setForm((prev) => ({
        ...prev,
        interestRate: String(config.interestRate || ""),
        warehouseMonthlyCost: String(config.warehouseMonthlyCost || ""),
        warehouseMaxCapacity: String(config.warehouseMaxCapacity || ""),
        spoilageRate: String(config.spoilageRate || ""),
        insuranceRate: String(config.insuranceRate || ""),
        storageCostCoefficient: String(config.storageCostCoefficient || ""),
      }));
    } catch (e) {
      toast({
        title: "Lỗi tải cấu hình kho",
        description: e instanceof Error ? e.message : "Không thể tải cấu hình",
        variant: "destructive",
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const submit = async () => {
    // Parse numeric values from form
    const formData = {
      warehouseName: form.warehouseName,
      warehouseConfigRequest: {
        interestRate: Number(form.interestRate),
        warehouseMonthlyCost: Number(form.warehouseMonthlyCost),
        warehouseMaxCapacity: Number(form.warehouseMaxCapacity),
        spoilageRate: Number(form.spoilageRate),
        insuranceRate: Number(form.insuranceRate),
      },
    };

    const parsed = warehouseSchema.safeParse(formData);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path.join(".");
        errs[path] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const data = parsed.data as any;
      if (editing) {
        await warehouseApi.update({
          id: editing.id,
          warehouseName: data.warehouseName,
          warehouseConfigUpdateRequest: {
            id: editing.configId,
            warehouseId: editing.id,
            interestRate: data.warehouseConfigRequest.interestRate,
            warehouseMonthlyCost:
              data.warehouseConfigRequest.warehouseMonthlyCost,
            warehouseMaxCapacity:
              data.warehouseConfigRequest.warehouseMaxCapacity,
            spoilageRate: data.warehouseConfigRequest.spoilageRate,
            insuranceRate: data.warehouseConfigRequest.insuranceRate,
          },
        });
        toast({ title: "Cập nhật kho thành công" });
      } else {
        await warehouseApi.create(data);
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">
              Quản lý Kho hàng
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Thêm/sửa kho, theo dõi tồn kho và thực hiện nhập/xuất hàng
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm kho mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
            Tổng số kho
          </p>
          <p className="text-3xl font-bold font-display text-gray-900">
            {warehouses.length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
            Đang hoạt động
          </p>
          <p className="text-3xl font-bold font-display text-emerald-600">
            {totalActive}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-3">
            Tổng tồn kho
          </p>
          <p className="text-3xl font-bold font-display text-primary">
            {formatNumber(totalInventoryAll)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kho theo tên..."
          className="pl-9 rounded-xl border-gray-200"
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
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Tên kho
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Số mặt hàng
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Tổng tồn
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => {
                  const active = w.isActive;
                  return (
                    <TableRow
                      key={w.id}
                      className="hover:bg-gray-50/50 transition-colors"
                      data-state={selectedId === w.id ? "selected" : undefined}
                    >
                      <TableCell className="font-semibold text-gray-900">
                        {w.warehouseName}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">
                        {formatNumber(Number(w.totalInventory ?? 0))}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-700">
                        {formatNumber(Number(w.items ?? 0))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full",
                            active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-gray-100 text-gray-400 border border-gray-200",
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              active ? "bg-emerald-500" : "bg-gray-300",
                            )}
                          />
                          {active ? "Hoạt động" : "Vô hiệu"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <button
                            title="Xem tồn kho"
                            onClick={() => setSelectedId(w.id)}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              selectedId === w.id
                                ? "bg-primary/10 text-primary"
                                : "text-gray-400 hover:text-primary hover:bg-primary/10",
                            )}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Nhập hàng"
                            disabled={!active}
                            onClick={() => openTransfer(w, "IMPORT")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Xuất hàng"
                            disabled={!active}
                            onClick={() => openTransfer(w, "EXPORT")}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Sửa"
                            onClick={() => openEdit(w)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title={active ? "Vô hiệu hóa" : "Kích hoạt"}
                            onClick={() => setConfirmTarget(w)}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                              active
                                ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50",
                            )}
                          >
                            {active ? (
                              <PowerOff className="h-3.5 w-3.5" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa thông tin kho" : "Thêm kho mới"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Cập nhật thông tin kho và cấu hình"
                : "Nhập tên kho và cấu hình chi phí"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* Warehouse Name */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Tên kho <span className="text-red-400">*</span>
              </Label>
              <Input
                value={form.warehouseName}
                onChange={(e) =>
                  setForm({ ...form, warehouseName: e.target.value })
                }
                placeholder="VD: Kho trung tâm"
                className="rounded-xl"
              />
              {errors.warehouseName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.warehouseName}
                </p>
              )}
            </div>

            {/* Configuration Section */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold mb-4 text-sm flex items-center gap-2 text-gray-700">
                Cấu hình kho
                {loadingConfig && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </h4>
              {loadingConfig ? (
                <div className="flex justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Interest Rate */}
                  <div className="space-y-1">
                    <Label>Lãi suất (%/năm) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.interestRate}
                      onChange={(e) =>
                        setForm({ ...form, interestRate: e.target.value })
                      }
                      placeholder="VD: 0.08"
                    />
                    {errors["warehouseConfigRequest.interestRate"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.interestRate"]}
                      </p>
                    )}
                  </div>

                  {/* Warehouse Monthly Cost */}
                  <div className="space-y-1">
                    <Label>Chi phí kho/tháng *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.warehouseMonthlyCost}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          warehouseMonthlyCost: e.target.value,
                        })
                      }
                      placeholder="VD: 1000"
                    />
                    {errors["warehouseConfigRequest.warehouseMonthlyCost"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.warehouseMonthlyCost"]}
                      </p>
                    )}
                  </div>

                  {/* Warehouse Max Capacity */}
                  <div className="space-y-1">
                    <Label>Sức chứa tối đa *</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={form.warehouseMaxCapacity}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          warehouseMaxCapacity: e.target.value,
                        })
                      }
                      placeholder="VD: 1000"
                    />
                    {errors["warehouseConfigRequest.warehouseMaxCapacity"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.warehouseMaxCapacity"]}
                      </p>
                    )}
                  </div>

                  {/* Spoilage Rate */}
                  <div className="space-y-1">
                    <Label>Tỉ lệ hao hụt (%/năm) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.spoilageRate}
                      onChange={(e) =>
                        setForm({ ...form, spoilageRate: e.target.value })
                      }
                      placeholder="VD: 0.02"
                    />
                    {errors["warehouseConfigRequest.spoilageRate"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.spoilageRate"]}
                      </p>
                    )}
                  </div>

                  {/* Insurance Rate */}
                  <div className="space-y-1">
                    <Label>Tỉ lệ bảo hiểm (%/năm) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.insuranceRate}
                      onChange={(e) =>
                        setForm({ ...form, insuranceRate: e.target.value })
                      }
                      placeholder="VD: 0.005"
                    />
                    {errors["warehouseConfigRequest.insuranceRate"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.insuranceRate"]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Hệ số bảo quản (%/năm) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.storageCostCoefficient}
                      placeholder="VD: 0.005"
                      readOnly
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    {errors["warehouseConfigRequest.insuranceRate"] && (
                      <p className="text-sm text-destructive">
                        {errors["warehouseConfigRequest.insuranceRate"]}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting || loadingConfig}
            >
              Hủy
            </Button>
            <Button onClick={submit} disabled={submitting || loadingConfig}>
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
            <DialogTitle className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  transferType === "IMPORT" ? "bg-primary/10" : "bg-amber-50",
                )}
              >
                {transferType === "IMPORT" ? (
                  <ArrowDownToLine className="h-4 w-4 text-primary" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
                )}
              </div>
              {transferType === "IMPORT"
                ? "Nhập hàng vào kho"
                : "Xuất hàng khỏi kho"}
              {transferWarehouse && (
                <span className="text-gray-400 font-normal text-base">
                  — {transferWarehouse.warehouseName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Chọn sản phẩm và nhập số lượng. Có thể thêm nhiều dòng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2 max-h-[50vh] overflow-y-auto">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex gap-2 items-center bg-gray-50 rounded-xl p-2"
              >
                <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <ProductSelector
                    value={line.productId}
                    onChange={(v) => updateLine(idx, { productId: v })}
                    placeholder="Chọn sản phẩm"
                    mode="combobox"
                    products={products}
                    loading={false}
                  />
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  className="w-32 rounded-xl font-mono bg-white"
                  placeholder="Số lượng"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(idx, { quantity: e.target.value })
                  }
                />
                <button
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addLine}
              className="rounded-xl gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm dòng
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(false)}
              disabled={transferring}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={submitTransfer}
              disabled={transferring}
              className="rounded-xl gap-2"
            >
              {transferring && <Loader2 className="h-4 w-4 animate-spin" />}
              {transferType === "IMPORT"
                ? "Xác nhận nhập hàng"
                : "Xác nhận xuất hàng"}
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
