import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { mockProducts, mockWarehouseConfig } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Loader2,
  CalendarClock,
  Info,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/utils/helpers";
import inventoryApi from "@/api/axiosConfig";
import type {
  ForecastSuggestion,
  InventoryResult,
  OrderSchedule,
} from "@/types";

// ── constants ──────────────────────────────────────────────────────────────────
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1;

// ── types ──────────────────────────────────────────────────────────────────────
interface ResolvedPeriod {
  planStartDate: string;
  planEndDate: string;
  scheduleStartDate: string;
  isCurrentMonth: boolean;
  label: string;
}

interface OverlappingPlan {
  id: number;
  startDate: string;
  endDate: string;
  label: string;
}

// ── helpers ────────────────────────────────────────────────────────────────────
function getYearOptions() {
  const years: number[] = [];
  for (let y = CURRENT_YEAR + 1; y >= 2020; y--) years.push(y);
  return years;
}

function getMonthOptions(year: number) {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
    disabled: year === CURRENT_YEAR && i + 1 < CURRENT_MONTH,
  }));
}

function validatePeriod(
  startMonth: number,
  endMonth: number,
  year: number,
): string | null {
  if (startMonth > endMonth) {
    return `Tháng bắt đầu (${startMonth}) không thể lớn hơn tháng kết thúc (${endMonth})`;
  }
  if (
    year < CURRENT_YEAR ||
    (year === CURRENT_YEAR && startMonth < CURRENT_MONTH)
  ) {
    return `Tháng ${startMonth}/${year} đã qua, không thể lập kế hoạch`;
  }
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewPlanPage() {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [productId, setProductId] = useState<string>("");
  const [startMonth, setStartMonth] = useState<number>(CURRENT_MONTH);
  const [endMonth, setEndMonth] = useState<number>(CURRENT_MONTH);
  const [targetYear, setTargetYear] = useState<number>(CURRENT_YEAR);
  const [demandQ, setDemandQ] = useState("");
  const [storageI, setStorageI] = useState(
    mockWarehouseConfig.storageCostCoefficient.toString(),
  );

  // ── Resolve period state ───────────────────────────────────────────────────
  const [resolvedPeriod, setResolvedPeriod] = useState<ResolvedPeriod | null>(
    null,
  );
  const [resolvingPeriod, setResolvingPeriod] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // ── AI suggestion state ────────────────────────────────────────────────────
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ForecastSuggestion | null>(null);

  // ── Overlap check + dialog state ───────────────────────────────────────────
  const [overlappingPlans, setOverlappingPlans] = useState<OverlappingPlan[]>(
    [],
  );
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);

  // ── Calculation state ──────────────────────────────────────────────────────
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<InventoryResult | null>(null);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedProduct = mockProducts.find((p) => p.id === Number(productId));
  const yearOptions = useMemo(() => getYearOptions(), []);
  const monthOptions = useMemo(() => getMonthOptions(targetYear), [targetYear]);

  // endMonth options: thêm disable nếu < startMonth
  const endMonthOptions = useMemo(
    () =>
      monthOptions.map((opt) => ({
        ...opt,
        disabled: opt.disabled || opt.value < startMonth,
      })),
    [monthOptions, startMonth],
  );

  const clientError = useMemo(
    () => validatePeriod(startMonth, endMonth, targetYear),
    [startMonth, endMonth, targetYear],
  );

  const canSubmit =
    !!productId &&
    !!demandQ &&
    !clientError &&
    !!resolvedPeriod &&
    !resolvingPeriod;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleYearChange = useCallback((year: number) => {
    setTargetYear(year);
    if (year === CURRENT_YEAR) {
      setStartMonth((prev) => Math.max(prev, CURRENT_MONTH));
      setEndMonth((prev) => Math.max(prev, CURRENT_MONTH));
    }
    setResolvedPeriod(null);
    setCalcResult(null);
    setOrderSchedules([]);
  }, []);

  const handleStartMonthChange = useCallback(
    (month: number) => {
      setStartMonth(month);
      if (endMonth < month) setEndMonth(month);
      setResolvedPeriod(null);
      setCalcResult(null);
      setOrderSchedules([]);
    },
    [endMonth],
  );

  const handleEndMonthChange = useCallback((month: number) => {
    setEndMonth(month);
    setResolvedPeriod(null);
    setCalcResult(null);
    setOrderSchedules([]);
  }, []);

  // ── Debounced resolve-period ───────────────────────────────────────────────
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (clientError) {
      setPeriodState(null, clientError);
      return;
    }

    setResolveError(null);
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

    resolveTimerRef.current = setTimeout(() => {
      setResolvingPeriod(true);
      inventoryApi
        .get("/inventory/resolve-period", {
          params: { startMonth, endMonth, year: targetYear },
        })
        .then((r) => {
          setResolvedPeriod(r.data);
          setResolveError(null);
        })
        .catch(() => setPeriodState(null, "Không thể kết nối để xác nhận kỳ"))
        .finally(() => setResolvingPeriod(false));
    }, 300);

    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, [startMonth, endMonth, targetYear, clientError]);

  function setPeriodState(period: ResolvedPeriod | null, error: string | null) {
    setResolvedPeriod(period);
    setResolveError(error);
  }

  // ── AI Suggest ─────────────────────────────────────────────────────────────
  const handleGetSuggestion = () => {
    if (!productId) return;
    setLoadingSuggestion(true);
    setSuggestion(null);

    // Endpoint suggest không cần planningUnit nữa
    inventoryApi
      .get(`/inventory/suggest/${productId}`)
      .then((r) => {
        const data = r.data?.data ?? r.data;
        setSuggestion(data);
        if (data?.suggestedQ != null) {
          setDemandQ(String(data.suggestedQ));
        }
      })
      .catch(() => {
        // fallback mock (dev)
        setSuggestion({
          productId: Number(productId),
          suggestedQ: 105.5,
          requiresManualInput: false,
          supplierName: "Công ty TNHH Lương thực Miền Nam",
          currentSupplyRateK: 166.67,
          currentFixedOrderCostA: 2000000,
          currentUnitPriceC: 8500000,
          currentLeadTimeDays: 30,
          demandForecast: {
            forecastValue: 105.5,
            modelUsed: "HOLT_WINTERS",
            dataPointsUsed: 24,
            mape: 8.3,
            mapeWarning: false,
          },
          leadTimeForecast: {
            forecastValue: 0.0967,
            modelUsed: "WMA",
            dataPointsUsed: 5,
            mape: null,
            mapeWarning: false,
          },
        } as ForecastSuggestion);
        setDemandQ("105.5");
      })
      .finally(() => setLoadingSuggestion(false));
  };

  // ── Submit: check overlap → dialog hoặc calculate trực tiếp ───────────────
  const handleSubmit = async () => {
    if (!canSubmit || !resolvedPeriod) return;

    const payload = {
      productId: Number(productId),
      startMonth,
      endMonth,
      year: targetYear,
      demandQ: parseFloat(demandQ),
      storageCostCoefficientI: parseFloat(storageI),
    };

    try {
      const overlapRes = await inventoryApi.post(
        "/inventory/check-overlap",
        payload,
      );
      const { hasOverlap, overlapping } =
        overlapRes.data?.data ?? overlapRes.data;

      if (hasOverlap && overlapping?.length > 0) {
        setOverlappingPlans(overlapping);
        setShowOverlapDialog(true);
      } else {
        await runCalculate(payload);
      }
    } catch {
      // Nếu check-overlap fail, vẫn cho phép tính toán
      await runCalculate(payload);
    }
  };

  // Xóa các kế hoạch trùng tuần tự rồi mới calculate
  const handleConfirmOverride = async () => {
    setShowOverlapDialog(false);
    setCalculating(true);

    try {
      for (const plan of overlappingPlans) {
        await inventoryApi.delete(`/inventory/parameters/${plan.id}`);
      }
      const payload = {
        productId: Number(productId),
        startMonth,
        endMonth,
        year: targetYear,
        demandQ: parseFloat(demandQ),
        storageCostCoefficientI: parseFloat(storageI),
      };
      await runCalculate(payload, false); // setCalculating managed here
    } catch (e) {
      console.error("Override error:", e);
      setCalculating(false);
    }
  };

  const runCalculate = async (payload: object, manageLoading = true) => {
    if (manageLoading) setCalculating(true);
    setCalcResult(null);
    setOrderSchedules([]);

    try {
      const calcRes = await inventoryApi.post("/inventory/calculate", payload);
      const result = calcRes.data?.data ?? calcRes.data;
      setCalcResult(result);

      // Fetch order schedules
      const { planStartDate, planEndDate } = resolvedPeriod!;
      const schedRes = await inventoryApi.get(`/order-schedules/${productId}`, {
        params: { from: planStartDate, to: planEndDate },
      });
      const schedules = schedRes.data?.data ?? schedRes.data ?? [];
      setOrderSchedules(Array.isArray(schedules) ? schedules : []);
    } catch (e) {
      console.error("Calculate error:", e);
    } finally {
      setCalculating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Tạo kỳ kế hoạch mới
        </h1>
        <p className="text-muted-foreground mt-1">
          Tính toán lượng đặt hàng tối ưu cho kỳ kế hoạch
        </p>
      </div>

      {/* ── Bước 1: Mặt hàng & kỳ ── */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 1: Chọn mặt hàng & kỳ kế hoạch
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mặt hàng */}
          <div className="space-y-2 md:col-span-2">
            <Label>Mặt hàng</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mặt hàng..." />
              </SelectTrigger>
              <SelectContent>
                {mockProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Năm */}
          <div className="space-y-2">
            <Label>Năm</Label>
            <Select
              value={targetYear.toString()}
              onValueChange={(v) => handleYearChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tháng bắt đầu */}
          <div className="space-y-2">
            <Label>Từ tháng</Label>
            <Select
              value={startMonth.toString()}
              onValueChange={(v) => handleStartMonthChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value.toString()}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tháng kết thúc */}
          <div className="space-y-2">
            <Label>Đến tháng</Label>
            <Select
              value={endMonth.toString()}
              onValueChange={(v) => handleEndMonthChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endMonthOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value.toString()}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period feedback */}
        {resolvingPeriod && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang xác nhận kỳ kế hoạch...
          </div>
        )}

        {!resolvingPeriod && resolveError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{resolveError}</p>
          </div>
        )}

        {!resolvingPeriod && resolvedPeriod && (
          <div className="bg-primary/10 border border-primary/30 rounded-md p-3 flex items-start gap-2">
            <CalendarClock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-0.5">
              <p className="font-medium text-foreground">
                {resolvedPeriod.label}
              </p>
              <p className="text-muted-foreground">
                {resolvedPeriod.planStartDate} → {resolvedPeriod.planEndDate}
              </p>
              <p className="text-muted-foreground">
                Lịch đặt hàng bắt đầu từ:{" "}
                <span className="font-medium text-foreground">
                  {new Date(
                    resolvedPeriod.scheduleStartDate,
                  ).toLocaleDateString("vi-VN")}
                </span>
                {resolvedPeriod.isCurrentMonth && (
                  <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                    Tháng hiện tại — lịch bắt đầu từ hôm nay
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* AI Suggest button — chỉ cần chọn sản phẩm */}
        {productId && (
          <Button
            onClick={handleGetSuggestion}
            disabled={loadingSuggestion}
            variant="outline"
            className="gap-2"
          >
            {loadingSuggestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Lấy gợi ý AI
          </Button>
        )}
      </div>

      {/* ── AI Suggestion panel ── */}
      {suggestion && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Gợi ý từ AI</h2>
            <Badge className="bg-status-success text-destructive-foreground">
              SUPPLIER_SERVICE ✓
            </Badge>
          </div>

          {suggestion.requiresManualInput && (
            <div className="bg-status-warning-bg border border-status-warning/30 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <p className="text-sm">
                Chưa đủ dữ liệu lịch sử. Vui lòng nhập Q theo kinh nghiệm.
              </p>
            </div>
          )}

          {suggestion.demandForecast?.mapeWarning && (
            <div className="bg-status-warning-bg border border-status-warning/30 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <p className="text-sm">
                MAPE = {suggestion.demandForecast.mape}%. Dự báo kém chính xác,
                hãy kiểm tra lại.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">Nhà cung cấp</p>
              <p className="font-medium text-foreground">
                {suggestion.supplierName}
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">
                Q đề xuất / tháng ({suggestion.demandForecast?.modelUsed})
              </p>
              <p className="font-mono font-medium text-foreground">
                {formatNumber(suggestion.suggestedQ)} {selectedProduct?.unit}
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">K (năng lực cung cấp)</p>
              <p className="font-mono font-medium text-foreground">
                {formatNumber(suggestion.currentSupplyRateK)}{" "}
                {selectedProduct?.unit}/tháng
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">A (chi phí đặt hàng)</p>
              <p className="font-mono font-medium text-foreground">
                {formatCurrency(suggestion.currentFixedOrderCostA)} VNĐ/lần
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">C (đơn giá)</p>
              <p className="font-mono font-medium text-foreground">
                {formatCurrency(suggestion.currentUnitPriceC)} VNĐ/
                {selectedProduct?.unit}
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">L (lead time)</p>
              <p className="font-mono font-medium text-foreground">
                {suggestion.currentLeadTimeDays} ngày
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bước 2: Tham số & tính toán ── */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 2: Xác nhận tham số & Tính toán
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Q — Nhu cầu tiêu thụ{" "}
              <span className="text-muted-foreground font-normal">
                (mỗi tháng)
              </span>
            </Label>
            <Input
              type="number"
              value={demandQ}
              onChange={(e) => setDemandQ(e.target.value)}
              placeholder="Nhập nhu cầu mỗi tháng..."
            />
          </div>
          <div className="space-y-2">
            <Label>
              I — Hệ số bảo quản{" "}
              <span className="text-muted-foreground font-normal">
                (theo năm, backend tự chia 12)
              </span>
            </Label>
            <Input
              type="number"
              value={storageI}
              onChange={(e) => setStorageI(e.target.value)}
              step="0.001"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={calculating || !canSubmit}
          className="gap-2"
        >
          {calculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Tạo kế hoạch
        </Button>
      </div>

      {/* ── Kết quả ── */}
      {calcResult && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-status-success" />
            Kết quả tối ưu
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "S* (Lượng đặt tối ưu)",
                value: `${formatNumber(calcResult.optimalOrderQtyS)} ${selectedProduct?.unit ?? ""}`,
              },
              {
                label: "n* (Số lần đặt)",
                value: formatNumber(calcResult.optimalOrderCountN),
              },
              {
                label: "τ* (Chu kỳ)",
                value: `${formatNumber(calcResult.optimalCycleTimeTau, 4)} kỳ`,
              },
              {
                label: "D_min (Chi phí tối thiểu)",
                value: formatCurrency(calcResult.minTotalCost),
              },
            ].map((m) => (
              <div key={m.label} className="bg-muted rounded-md p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lịch đặt hàng ── */}
      {orderSchedules.length > 0 && resolvedPeriod && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Lịch đặt hàng — {resolvedPeriod.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {orderSchedules.length} lần đặt hàng trong kỳ
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Lần
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Ngày đặt
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Ngày giao dự kiến
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Số lượng
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Chi phí ước tính
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orderSchedules.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono">#{o.orderSequence}</td>
                    <td className="px-4 py-3">{formatDate(o.orderDate)}</td>
                    <td className="px-4 py-3">
                      {formatDate(o.expectedDeliveryDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(o.orderQuantity)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(o.estimatedCost)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {o.actualOrderDate ? (
                        <Badge className="bg-status-success text-destructive-foreground">
                          Đã đặt
                        </Badge>
                      ) : o.isReorderWarning ? (
                        <Badge className="bg-status-danger text-destructive-foreground">
                          Cần đặt ngay
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Chờ</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dialog xác nhận xóa kế hoạch trùng ── */}
      <Dialog open={showOverlapDialog} onOpenChange={setShowOverlapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Phát hiện kế hoạch trùng lặp
            </DialogTitle>
            <DialogDescription>
              Các kế hoạch sau sẽ bị xóa khi bạn xác nhận. Lịch đặt hàng liên
              quan cũng sẽ bị xóa theo.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 my-2">
            {overlappingPlans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center gap-2 text-sm bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
              >
                <Trash2 className="h-4 w-4 text-destructive shrink-0" />
                <span className="font-medium text-foreground">
                  {plan.label}
                </span>
                <span className="text-muted-foreground ml-auto">
                  {plan.startDate} → {plan.endDate}
                </span>
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOverlapDialog(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmOverride}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Xác nhận xóa và tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
