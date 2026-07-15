import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Plus,
  AlertTriangle,
  Check,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProductSelector from "@/components/product/ProductSelector";
import { stocktakingApi } from "@/api/stocktakingApi";
import { employeeApi, EmployeeResponse } from "@/api/employeeApi";
import type { StockCount } from "@/types/inventory-opt/StockCount";
import KpiCard from "@/components/common/KpiCard";
import { cn } from "@/lib/utils";

export default function StocktakingPage() {
  const [productId, setProductId] = useState("");
  const [countDate, setCountDate] = useState<Date | undefined>(new Date());
  const [countedBy, setCountedBy] = useState("");

  const [history, setHistory] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    stockCount: StockCount | null;
    actualQuantity: string;
    notes: string;
    confirming: boolean;
  }>({
    visible: false,
    stockCount: null,
    actualQuantity: "",
    notes: "",
    confirming: false,
  });
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const employeeOptions = employees.map((emp) => ({
    ...emp,
    fullName: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim(),
  }));

  // Load history khi productId thay đổi
  useEffect(() => {
    if (!productId) {
      setHistory([]);
      return;
    }
    loadHistory();
  }, [productId]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesData = await employeeApi.getAll();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  const loadHistory = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const data = await stocktakingApi.getHistory(productId);
      setHistory(data);
    } catch (error: any) {
      toast.error("Lỗi tải lịch sử", {
        description: error?.response?.data?.message || "Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!productId || !countDate) {
      toast.error("Vui lòng chọn sản phẩm và ngày kiểm kê");
      return;
    }

    try {
      setCreatingDraft(true);
      const response = await stocktakingApi.createDraft({
        productId,
        countDate: format(countDate, "yyyy-MM-dd"),
        countedBy: countedBy || undefined,
      });

      toast.success("Tạo phiếu kiểm kê thành công", {
        description: `Số lượng hệ thống: ${response.systemQuantity}`,
      });

      setCountDate(new Date());
      setCountedBy("");
      await loadHistory();
    } catch (error: any) {
      toast.error("Lỗi tạo phiếu kiểm kê", {
        description: error?.response?.data?.message || "Không thể tạo phiếu",
      });
    } finally {
      setCreatingDraft(false);
    }
  };

  const handleOpenConfirmModal = (stockCount: StockCount) => {
    setConfirmModal({
      visible: true,
      stockCount,
      actualQuantity: "",
      notes: "",
      confirming: false,
    });
  };

  const handleConfirmStockCount = async () => {
    const { stockCount, actualQuantity, notes } = confirmModal;
    if (!stockCount) return;

    if (!actualQuantity || isNaN(parseFloat(actualQuantity))) {
      toast.error("Vui lòng nhập số lượng thực tế");
      return;
    }

    try {
      setConfirmModal((prev) => ({ ...prev, confirming: true }));
      const response = await stocktakingApi.confirm(stockCount.id, {
        actualQuantity: parseFloat(actualQuantity),
        notes: notes || undefined,
      });

      toast.success("Xác nhận phiếu kiểm kê thành công", {
        description: `Chênh lệch: ${response.varianceQty} (${(response.varianceRate! * 100).toFixed(1)}%)`,
      });

      setConfirmModal({
        visible: false,
        stockCount: null,
        actualQuantity: "",
        notes: "",
        confirming: false,
      });
      await loadHistory();
    } catch (error: any) {
      toast.error("Lỗi xác nhận phiếu", {
        description: error?.response?.data?.message || "Không thể xác nhận",
      });
    } finally {
      setConfirmModal((prev) => ({ ...prev, confirming: false }));
    }
  };

  // Tính KPI từ lịch sử
  const confirmedCount = history.filter((h) => h.status === "CONFIRMED").length;
  const draftCount = history.filter((h) => h.status === "DRAFT").length;
  const avgVarianceRate =
    history
      .filter((h) => h.status === "CONFIRMED" && h.varianceRate !== null)
      .reduce((sum, h) => sum + (h.varianceRate || 0), 0) /
    (confirmedCount || 1);
  const totalLoss = history
    .filter((h) => h.status === "CONFIRMED" && (h.varianceValue || 0) < 0)
    .reduce((sum, h) => sum + (h.varianceValue || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kiểm kê kho</h1>
        <p className="mt-2 text-gray-600">
          Tạo phiếu kiểm kê để ghi nhận số lượng thực tế và phát hiện hao hụt
        </p>
      </div>

      {/* KPI Cards */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Phiếu CONFIRMED"
            value={confirmedCount}
            icon={Check}
            variant="success"
          />
          <KpiCard
            title="Phiếu DRAFT"
            value={draftCount}
            icon={Plus}
            variant="info"
          />
          <KpiCard
            title="Chênh lệch trung bình"
            value={`${(avgVarianceRate * 100).toFixed(2)}%`}
            icon={AlertTriangle}
            variant={Math.abs(avgVarianceRate) > 0.05 ? "danger" : "info"}
          />
          <KpiCard
            title="Tổng thất thoát"
            value={`${totalLoss.toLocaleString("vi-VN")} VND`}
            icon={AlertTriangle}
            variant={totalLoss < 0 ? "danger" : "success"}
          />
        </div>
      )}

      {/* Form Tạo Phiếu Kiểm Kê */}
      <Card>
        <CardHeader>
          <CardTitle>Tạo phiếu kiểm kê mới</CardTitle>
          <CardDescription>
            Chọn sản phẩm và ngày kiểm kê. Số lượng hệ thống sẽ được tính tự
            động.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Selector */}
            <div className="space-y-2">
              <Label>Sản phẩm</Label>
              <ProductSelector
                value={productId}
                onChange={setProductId}
                placeholder="Chọn sản phẩm..."
              />
            </div>

            {/* Count Date */}
            <div className="space-y-2">
              <Label>Ngày kiểm kê</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !countDate && "text-gray-400",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {countDate ? format(countDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={countDate}
                    onSelect={setCountDate}
                    initialFocus
                    disabled={(d) => d > new Date()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Counted By */}
            <div className="space-y-2">
              <Label>Người thực hiện</Label>
              <Select value={countedBy} onValueChange={setCountedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => {
                    const fullName =
                      `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();

                    return (
                      <SelectItem key={emp.id} value={emp.id}>
                        {fullName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreateDraft}
              disabled={!productId || !countDate || creatingDraft}
              className="gap-2"
            >
              {creatingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
              {creatingDraft ? "Đang tạo..." : "Tạo phiếu DRAFT"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử Kiểm Kê */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử kiểm kê</CardTitle>
          <CardDescription>
            {history.length > 0
              ? `${history.length} phiếu kiểm kê`
              : "Chọn sản phẩm để xem lịch sử"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có phiếu kiểm kê nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày kiểm kê</TableHead>
                    <TableHead className="text-right">SL hệ thống</TableHead>
                    <TableHead className="text-right">SL thực tế</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                    <TableHead className="text-right">Tỷ lệ %</TableHead>
                    <TableHead>Người kiểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((sc) => (
                    <TableRow key={sc.id}>
                      <TableCell>{sc.countDate}</TableCell>
                      <TableCell className="text-right font-mono">
                        {sc.systemQuantity.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sc.actualQuantity !== null
                          ? sc.actualQuantity.toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sc.varianceQty !== null ? (
                          <span
                            className={
                              sc.varianceQty < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {sc.varianceQty > 0 ? "+" : ""}
                            {sc.varianceQty.toFixed(2)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {sc.varianceRate !== null ? (
                          <span
                            className={
                              sc.lossWarning ? "font-bold text-red-600" : ""
                            }
                          >
                            {(sc.varianceRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{sc.countedBy || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sc.status === "CONFIRMED" ? "default" : "outline"
                          }
                        >
                          {sc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {sc.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenConfirmModal(sc)}
                          >
                            Xác nhận
                          </Button>
                        )}
                        {sc.lossWarning && (
                          <div className="inline-block ml-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Modal */}
      <Dialog
        open={confirmModal.visible}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmModal({
              visible: false,
              stockCount: null,
              actualQuantity: "",
              notes: "",
              confirming: false,
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phiếu kiểm kê</DialogTitle>
            <DialogDescription>
              Nhập số lượng thực tế đã đếm được
            </DialogDescription>
          </DialogHeader>

          {confirmModal.stockCount && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày kiểm kê:</span>
                  <span className="font-semibold">
                    {confirmModal.stockCount.countDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SL hệ thống:</span>
                  <span className="font-semibold">
                    {confirmModal.stockCount.systemQuantity.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualQty">
                  Số lượng thực tế
                  <span className="text-red-600 ml-1">*</span>
                </Label>
                <Input
                  id="actualQty"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={confirmModal.actualQuantity}
                  onChange={(e) =>
                    setConfirmModal((prev) => ({
                      ...prev,
                      actualQuantity: e.target.value,
                    }))
                  }
                  autoFocus
                />
                {confirmModal.actualQuantity && (
                  <div className="text-sm text-gray-600">
                    Chênh lệch:
                    <span
                      className={
                        parseFloat(confirmModal.actualQuantity) <
                        confirmModal.stockCount.systemQuantity
                          ? "text-red-600 ml-1 font-semibold"
                          : "text-green-600 ml-1 font-semibold"
                      }
                    >
                      {(
                        parseFloat(confirmModal.actualQuantity) -
                        confirmModal.stockCount.systemQuantity
                      ).toFixed(2)}{" "}
                      (
                      {(
                        ((parseFloat(confirmModal.actualQuantity) -
                          confirmModal.stockCount.systemQuantity) /
                          confirmModal.stockCount.systemQuantity) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Nhập ghi chú nếu cần..."
                  value={confirmModal.notes}
                  onChange={(e) =>
                    setConfirmModal((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmModal({
                  visible: false,
                  stockCount: null,
                  actualQuantity: "",
                  notes: "",
                  confirming: false,
                })
              }
              disabled={confirmModal.confirming}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmStockCount}
              disabled={confirmModal.confirming}
              className="gap-2"
            >
              {confirmModal.confirming && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {confirmModal.confirming ? "Đang xác nhận..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
