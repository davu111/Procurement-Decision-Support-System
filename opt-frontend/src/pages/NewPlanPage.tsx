import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { mockWarehouseConfig } from "@/data/mockData";
import { productApi } from "@/api/productApi";
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
  RefreshCw,
  Package,
  Truck,
  Lightbulb,
} from "lucide-react";
import ProductSelector from "@/components/product/ProductSelector";
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
  label: string;
  status: "ACTIVE" | "SUPERSEDED";
}

interface PendingReceipt {
  orderDate: string;
  expectedDeliveryDate: string;
  quantity: number;
}

interface PredictedInventory {
  predictedInventory: number | null;
  suggestedStartDate: string | null;
  message: string;
  pendingReceipts: PendingReceipt[];
}

// "create" = Luồng A — tạo kế hoạch lần đầu
// "replan" = Luồng B — thay thế kế hoạch cũ
type FlowMode = "create" | "replan";

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
  if (startMonth > endMonth)
    return `Tháng bắt đầu (${startMonth}) không thể lớn hơn tháng kết thúc (${endMonth})`;
  if (
    year < CURRENT_YEAR ||
    (year === CURRENT_YEAR && startMonth < CURRENT_MONTH)
  )
    return `Tháng ${startMonth}/${year} đã qua, không thể lập kế hoạch`;
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewPlanPage() {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [productId, setProductId] = useState("");
  const [startMonth, setStartMonth] = useState(CURRENT_MONTH);
  const [endMonth, setEndMonth] = useState(CURRENT_MONTH);
  const [targetYear, setTargetYear] = useState(CURRENT_YEAR);
  const [demandQ, setDemandQ] = useState("");
  const [storageI, setStorageI] = useState(
    mockWarehouseConfig.storageCostCoefficient.toString(),
  );

  // ── Flow mode ──────────────────────────────────────────────────────────────
  const [flowMode, setFlowMode] = useState<FlowMode>("create");

  // ── Resolve period ─────────────────────────────────────────────────────────
  const [resolvedPeriod, setResolvedPeriod] = useState<ResolvedPeriod | null>(
    null,
  );
  const [resolvingPeriod, setResolvingPeriod] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // ── AI suggestion ──────────────────────────────────────────────────────────
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ForecastSuggestion | null>(null);

  // ── Overlap dialog ─────────────────────────────────────────────────────────
  const [overlappingPlans, setOverlappingPlans] = useState<OverlappingPlan[]>(
    [],
  );
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);

  // ── Replan: predict inventory ──────────────────────────────────────────────
  const [predictedData, setPredictedData] = useState<PredictedInventory | null>(
    null,
  );
  const [predictingInventory, setPredictingInventory] = useState(false);
  const [initialInventory, setInitialInventory] = useState("");

  // ── Calculation ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [calcResult, setCalcResult] = useState<InventoryResult | null>(null);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Products from API ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<any[]>([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedProduct = productId
    ? products.find((p) => String(p.id) === productId)
    : undefined;

  // ── Fetch products on component mount ─────────────────────────────────────
  useEffect(() => {
    productApi.getAll().then((data) => setProducts(data));
  }, []);

  const yearOptions = useMemo(() => getYearOptions(), []);
  const monthOptions = useMemo(() => getMonthOptions(targetYear), [targetYear]);
  const endMonthOptions = useMemo(
    () =>
      monthOptions.map((o) => ({
        ...o,
        disabled: o.disabled || o.value < startMonth,
      })),
    [monthOptions, startMonth],
  );
  const clientError = useMemo(
    () => validatePeriod(startMonth, endMonth, targetYear),
    [startMonth, endMonth, targetYear],
  );

  // Số tháng trong kỳ — dùng để hint Q/tháng
  const monthCount = endMonth - startMonth + 1;

  const canSubmit =
    !!productId &&
    !!demandQ &&
    parseFloat(demandQ) > 0 &&
    !clientError &&
    !!resolvedPeriod &&
    !resolvingPeriod &&
    (flowMode === "create" || !!initialInventory);

  // ── Handlers: filter ───────────────────────────────────────────────────────
  const resetResults = useCallback(() => {
    setCalcResult(null);
    setOrderSchedules([]);
    setSuccessMessage(null);
    setResolvedPeriod(null);
    setPredictedData(null);
    setInitialInventory("");
  }, []);

  const handleYearChange = useCallback(
    (year: number) => {
      setTargetYear(year);
      if (year === CURRENT_YEAR) {
        setStartMonth((p) => Math.max(p, CURRENT_MONTH));
        setEndMonth((p) => Math.max(p, CURRENT_MONTH));
      }
      resetResults();
    },
    [resetResults],
  );

  const handleStartMonthChange = useCallback(
    (month: number) => {
      setStartMonth(month);
      if (endMonth < month) setEndMonth(month);
      resetResults();
    },
    [endMonth, resetResults],
  );

  const handleEndMonthChange = useCallback(
    (month: number) => {
      setEndMonth(month);
      resetResults();
    },
    [resetResults],
  );

  // ── Debounced resolve-period ───────────────────────────────────────────────
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (clientError) {
      setResolveError(clientError);
      setResolvedPeriod(null);
      return;
    }
    setResolveError(null);
    if (resolveTimer.current) clearTimeout(resolveTimer.current);

    resolveTimer.current = setTimeout(() => {
      setResolvingPeriod(true);
      inventoryApi
        .get("/inventory/resolve-period", {
          params: { startMonth, endMonth, year: targetYear },
        })
        .then((res: any) => {
          setResolvedPeriod(res.data);
          setResolveError(null);
        })
        .catch((e: Error) => {
          setResolvedPeriod(null);
          setResolveError(e.message);
        })
        .finally(() => setResolvingPeriod(false));
    }, 300);

    return () => {
      if (resolveTimer.current) clearTimeout(resolveTimer.current);
    };
  }, [startMonth, endMonth, targetYear, clientError]);

  // ── Predict inventory khi ở mode replan và resolvedPeriod sẵn sàng ────────
  const predictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (flowMode !== "replan" || !resolvedPeriod || !productId) return;

    setPredictedData(null);
    setInitialInventory("");
    setPredictingInventory(true);

    if (predictTimer.current) clearTimeout(predictTimer.current);
    predictTimer.current = setTimeout(() => {
      inventoryApi
        .get(`/inventory/predict-inventory/${productId}`, {
          params: { targetDate: resolvedPeriod.planStartDate },
        })
        .then((res: any) => {
          const data: PredictedInventory = res.data;
          setPredictedData(data);
          if (data.predictedInventory != null) {
            setInitialInventory(String(data.predictedInventory));
          }
        })
        .catch(() => {
          // Người dùng tự nhập thủ công
        })
        .finally(() => setPredictingInventory(false));
    }, 300);

    return () => {
      if (predictTimer.current) clearTimeout(predictTimer.current);
    };
  }, [flowMode, resolvedPeriod, productId]);

  // ── AI Suggest ─────────────────────────────────────────────────────────────
  const handleGetSuggestion = () => {
    if (!productId) return;
    setLoadingSuggestion(true);
    setSuggestion(null);

    inventoryApi
      .get(`/inventory/suggest/${productId}`)
      .then((res: any) => {
        const data = res.data;
        setSuggestion(data);
        // suggestedQ từ API là Q/tháng → nhân monthCount ra Q tổng kỳ
        if (data?.suggestedQ != null) {
          setDemandQ(
            String(Math.round(data.suggestedQ * monthCount * 100) / 100),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSuggestion(false));
  };

  // ── Luồng A: submit → check-overlap ───────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || !resolvedPeriod) return;
    const payload = buildPayload();
    try {
      const overlapRes = await inventoryApi.post(
        "/inventory/check-overlap",
        payload,
      );
      const { hasOverlap, overlapping } = (overlapRes as any).data;
      if (hasOverlap && overlapping?.length > 0) {
        setOverlappingPlans(overlapping);
        setShowOverlapDialog(true);
      } else {
        await runCalculate(payload);
      }
    } catch {
      await runCalculate(payload);
    }
  };

  // Dialog: người dùng chọn "Chuyển sang Replan"
  const handleSwitchToReplan = () => {
    setShowOverlapDialog(false);
    setFlowMode("replan");
    // predictInventory effect sẽ tự chạy vì flowMode thay đổi
  };

  // ── Luồng B: replan ────────────────────────────────────────────────────────
  const handleReplan = async () => {
    console.log("Replan payload:");
    if (!canSubmit || !resolvedPeriod) return;

    const firstPendingReceipt = predictedData?.pendingReceipts?.[0];
    const payload = {
      ...buildPayload(),
      initialInventory: parseFloat(initialInventory),
      ...(firstPendingReceipt && {
        scheduledReceiptQty: firstPendingReceipt.quantity,
        scheduledReceiptDate: firstPendingReceipt.expectedDeliveryDate,
      }),
    };

    setSubmitting(true);
    setCalcResult(null);
    setOrderSchedules([]);
    setSuccessMessage(null);

    try {
      const res = await inventoryApi.post("/inventory/replan", payload);
      const result = (res as any).data;
      setCalcResult(result);
      setSuccessMessage(
        "Replan thành công. Kế hoạch cũ đã được lưu lại làm lịch sử.",
      );
      await fetchSchedules(result.id);
    } catch (e) {
      console.error("Replan error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function buildPayload() {
    return {
      productId: Number(productId),
      startMonth,
      endMonth,
      year: targetYear,
      demandQ: parseFloat(demandQ),
      storageCostCoefficientI: parseFloat(storageI),
    };
  }

  async function runCalculate(payload: object) {
    setSubmitting(true);
    setCalcResult(null);
    setOrderSchedules([]);
    setSuccessMessage(null);
    try {
      const res = await inventoryApi.post("/inventory/calculate", payload);
      const result = (res as any).data;
      setCalcResult(result);
      setSuccessMessage("Tạo kế hoạch thành công.");
      await fetchSchedules(result.id);
    } catch (e) {
      console.error("Calculate error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchSchedules(resultId?: number) {
    console.log("Resolved period:", resolvedPeriod);
    console.log("Calc result:", calcResult);
    if (!resolvedPeriod) return;
    try {
      const res = await inventoryApi.get(`/order-schedules/result/${resultId}`);
      const data = (res as any).data ?? [];
      setOrderSchedules(Array.isArray(data) ? data : []);
    } catch {
      // schedules là optional — không block UX
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {flowMode === "replan"
            ? "Điều chỉnh kế hoạch (Replan)"
            : "Tạo kỳ kế hoạch mới"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {flowMode === "replan"
            ? "Thay thế kế hoạch cũ — kế hoạch gốc được giữ lại làm lịch sử"
            : "Tính toán lượng đặt hàng tối ưu cho kỳ kế hoạch"}
        </p>
      </div>

      {/* Mode banner */}
      {flowMode === "replan" && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
          <RefreshCw className="h-4 w-4 text-primary shrink-0" />
          <div className="text-sm text-foreground flex-1">
            Đang ở chế độ <span className="font-semibold">Replan</span>. Kế
            hoạch cũ sẽ được đánh dấu{" "}
            <Badge variant="secondary" className="text-[10px]">
              SUPERSEDED
            </Badge>
            , không bị xóa.
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0"
            onClick={() => {
              setFlowMode("create");
              resetResults();
            }}
          >
            Quay lại tạo mới
          </Button>
        </div>
      )}

      {/* ── Bước 1: Mặt hàng & kỳ ────────────────────────────────────────────── */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 1: Chọn mặt hàng & kỳ kế hoạch
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mặt hàng */}
          <div className="flex flex-col gap-1 space-y-2">
            <Label className="mt-2">Mặt hàng</Label>
            <ProductSelector
              mode="combobox"
              value={productId}
              onChange={(id) => {
                setProductId(id);
                resetResults();
                setSuggestion(null);
              }}
            />
          </div>

          {/* Năm */}
          <div className="space-y-2">
            <Label>Năm</Label>
            <Select
              value={targetYear.toString()}
              onValueChange={(v) => handleYearChange(Number(v))}
            >
              <SelectTrigger disabled={!productId}>
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

          {/* Từ tháng */}
          <div className="space-y-2">
            <Label>Từ tháng</Label>
            <Select
              value={startMonth.toString()}
              onValueChange={(v) => handleStartMonthChange(Number(v))}
            >
              <SelectTrigger disabled={!productId}>
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

          {/* Đến tháng */}
          <div className="space-y-2">
            <Label>Đến tháng</Label>
            <Select
              value={endMonth.toString()}
              onValueChange={(v) => handleEndMonthChange(Number(v))}
            >
              <SelectTrigger disabled={!productId}>
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
                    Tháng hiện tại
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* AI Suggest — chỉ cần productId, không cần period */}
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
            Thông tin nhà cung cấp
          </Button>
        )}
      </div>

      {/* ── AI Suggestion panel ───────────────────────────────────────────────── */}
      {suggestion && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            {/* <h2 className="font-semibold text-foreground">Gợi ý từ AI</h2> */}
            <Badge className="bg-status-success text-destructive-foreground">
              Thông tin nhà cung cấp ✓
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
            {[
              { label: "Nhà cung cấp", value: suggestion.supplierName },
              {
                label: `Q đề xuất / tháng (${suggestion.demandForecast?.modelUsed})`,
                value: `${formatNumber(suggestion.suggestedQ)} ${selectedProduct?.unit ?? ""}`,
              },
              {
                label: "K (năng lực cung cấp)",
                value: `${formatNumber(suggestion.currentSupplyRateK)} ${selectedProduct?.unit ?? ""}/tháng`,
              },
              {
                label: "A (chi phí đặt hàng)",
                value: `${formatCurrency(suggestion.currentFixedOrderCostA)} VNĐ/lần`,
              },
              {
                label: "C (đơn giá)",
                value: `${formatCurrency(suggestion.currentUnitPriceC)} VNĐ/${selectedProduct?.unit ?? ""}`,
              },
              {
                label: "L (lead time)",
                value: `${suggestion.currentLeadTimeDays} ngày`,
              },
            ].map((item) => (
              <div key={item.label} className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground">{item.label}</p>
                <p className="font-mono font-medium text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Replan: panel tồn kho dự đoán ────────────────────────────────────── */}
      {flowMode === "replan" && resolvedPeriod && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tồn kho tại thời điểm bắt đầu kế hoạch mới
          </h2>

          {predictingInventory && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang dự đoán tồn kho tại {resolvedPeriod.planStartDate}...
            </div>
          )}

          {!predictingInventory && predictedData && (
            <div className="bg-muted rounded-md p-4 space-y-3 text-sm">
              {/* Tồn kho dự đoán */}
              {predictedData.predictedInventory != null ? (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Tồn kho dự đoán tại{" "}
                    <span className="font-medium">
                      {resolvedPeriod.planStartDate}
                    </span>
                    :{" "}
                    <span className="font-mono font-bold text-foreground">
                      {formatNumber(predictedData.predictedInventory)}{" "}
                      {selectedProduct?.unit}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>{predictedData.message}</span>
                </div>
              )}

              {/* Lô hàng đang về */}
              {predictedData.pendingReceipts.length > 0 && (
                <div className="flex items-start gap-2">
                  <Truck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      Lô hàng đang về:
                    </p>
                    {predictedData.pendingReceipts.map((r, i) => (
                      <p key={i} className="text-muted-foreground">
                        {formatNumber(r.quantity)} {selectedProduct?.unit} —
                        giao{" "}
                        {new Date(r.expectedDeliveryDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Đề xuất ngày bắt đầu */}
              {predictedData.suggestedStartDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{predictedData.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Input tồn kho thực tế — luôn hiển thị, có thể sửa */}
          <div className="space-y-2">
            <Label>
              Tồn kho thực tế tại ngày bắt đầu{" "}
              <span className="text-muted-foreground font-normal">
                (có thể điều chỉnh)
              </span>
            </Label>
            <Input
              type="number"
              value={initialInventory}
              onChange={(e) => setInitialInventory(e.target.value)}
              placeholder="Nhập tồn kho tại ngày bắt đầu kế hoạch..."
            />
          </div>
        </div>
      )}

      {/* ── Bước 2: Tham số & tính toán ──────────────────────────────────────── */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          {flowMode === "replan"
            ? "Bước 2: Xác nhận tham số & Replan"
            : "Bước 2: Xác nhận tham số & Tính toán"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Q — Nhu cầu tiêu thụ{" "}
              <span className="text-muted-foreground font-normal">
                (tổng {monthCount} tháng)
              </span>
            </Label>
            <Input
              type="number"
              value={demandQ}
              onChange={(e) => setDemandQ(e.target.value)}
              placeholder={`Tổng nhu cầu cho ${monthCount} tháng...`}
            />
            {demandQ && parseFloat(demandQ) > 0 && (
              <p className="text-xs text-muted-foreground">
                ≈ {formatNumber(parseFloat(demandQ) / monthCount)}{" "}
                {selectedProduct?.unit ?? "đv"}/tháng
              </p>
            )}
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
          onClick={flowMode === "replan" ? handleReplan : handleSubmit}
          disabled={submitting || !canSubmit}
          className="gap-2"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : flowMode === "replan" ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {flowMode === "replan" ? "Xác nhận Replan" : "Tạo kế hoạch"}
        </Button>
      </div>

      {/* Success */}
      {successMessage && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-md p-3 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-status-success shrink-0" />
          <p className="text-sm text-foreground">{successMessage}</p>
        </div>
      )}

      {/* ── Kết quả ───────────────────────────────────────────────────────────── */}
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

      {/* ── Lịch đặt hàng ─────────────────────────────────────────────────────── */}
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
                  {[
                    ["Lần", "text-left"],
                    ["Ngày đặt", "text-left"],
                    ["Ngày giao dự kiến", "text-left"],
                    ["Số lượng", "text-right"],
                    ["Chi phí ước tính", "text-right"],
                    ["Trạng thái", "text-center"],
                  ].map(([h, align]) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-medium text-muted-foreground ${align}`}
                    >
                      {h}
                    </th>
                  ))}
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

      {/* ── Dialog: kế hoạch trùng ─────────────────────────────────────────────── */}
      <Dialog open={showOverlapDialog} onOpenChange={setShowOverlapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Đã có kế hoạch trùng lặp
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                Không thể tạo mới vì khoảng thời gian đã có kế hoạch. Chuyển
                sang <strong>Replan</strong> để thay thế — kế hoạch gốc sẽ được
                giữ lại làm lịch sử với trạng thái{" "}
                <Badge variant="secondary" className="text-[10px]">
                  SUPERSEDED
                </Badge>
                .
              </div>
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2 my-1">
            {overlappingPlans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between text-sm bg-muted rounded-md px-3 py-2"
              >
                <span className="font-medium text-foreground">
                  {plan.label}
                </span>
                <Badge
                  variant={plan.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {plan.status}
                </Badge>
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
            <Button onClick={handleSwitchToReplan} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Chuyển sang Replan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
