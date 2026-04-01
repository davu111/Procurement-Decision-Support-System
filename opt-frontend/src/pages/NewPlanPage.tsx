import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Loader2,
  CalendarClock,
  Info,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import {
  isPeriodValid,
  getMonthOptions,
  getQuarterOptions,
  getYearOptions,
  formatPeriodLabel,
} from "@/utils/periodHelpers";
import inventoryApi from "@/api/axiosConfig";
import type {
  PlanningUnit,
  ForecastSuggestion,
  InventoryResult,
  OrderSchedule,
} from "@/types";

interface ResolvedPeriod {
  planStartDate: string;
  scheduleStartDate: string;
  isCurrentPeriod: boolean;
}

export default function NewPlanPage() {
  const currentYear = new Date().getFullYear();

  const [productId, setProductId] = useState<string>("");
  const [planningUnit, setPlanningUnit] = useState<PlanningUnit>("MONTH");
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [targetPeriod, setTargetPeriod] = useState<number | null>(null);
  const [demandQ, setDemandQ] = useState("");
  const [storageI, setStorageI] = useState(
    mockWarehouseConfig.storageCostCoefficient.toString(),
  );

  const [resolvedPeriod, setResolvedPeriod] = useState<ResolvedPeriod | null>(
    null,
  );
  const [resolvingPeriod, setResolvingPeriod] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ForecastSuggestion | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<InventoryResult | null>(null);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  // Reset targetPeriod when planningUnit or year changes
  useEffect(() => {
    if (planningUnit === "YEAR") {
      setTargetPeriod(targetYear);
    } else {
      setTargetPeriod(null);
    }
    setResolvedPeriod(null);
    setResolveError(null);
  }, [planningUnit, targetYear]);

  // Debounced resolve-period API call
  useEffect(() => {
    if (targetPeriod === null) {
      setResolvedPeriod(null);
      setResolveError(null);
      return;
    }

    if (!isPeriodValid(planningUnit, targetPeriod, targetYear)) {
      setResolveError(
        `Không thể lập kế hoạch cho kỳ đã qua: ${formatPeriodLabel(planningUnit, targetPeriod, targetYear)}`,
      );
      setResolvedPeriod(null);
      return;
    }

    setResolvingPeriod(true);
    setResolveError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await inventoryApi.get("/inventory/resolve-period", {
          params: { planningUnit, targetPeriod, targetYear },
        });
        setResolvedPeriod(res.data);
        setResolveError(null);
      } catch (err: any) {
        // Fallback: compute locally if API unavailable
        setResolvedPeriod(null);
        const msg = err?.message || "Không thể kết nối server để xác nhận kỳ";
        setResolveError(msg);
      } finally {
        setResolvingPeriod(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [planningUnit, targetPeriod, targetYear]);

  const handleGetSuggestion = () => {
    setLoadingSuggestion(true);
    setTimeout(() => {
      setSuggestion({
        productId: Number(productId),
        planningUnit,
        suggestedQ: 105.5,
        requiresManualInput: false,
        supplierName: "Công ty TNHH Lương thực Miền Nam",
        supplierProductId: 1,
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
      });
      setDemandQ("105.5");
      setLoadingSuggestion(false);
    }, 1500);
  };

  const handleCalculate = async () => {
    if (!resolvedPeriod || targetPeriod === null) return;
    setCalculating(true);
    setCalcResult(null);
    setOrderSchedules([]);

    try {
      // Step 1: Call calculate API
      const calcRes = await inventoryApi.post("/inventory/calculate", {
        productId: Number(productId),
        planningUnit,
        targetPeriod,
        targetYear,
        demandQ: parseFloat(demandQ),
        storageCostCoefficientI: parseFloat(storageI),
      });
      const result = calcRes.data?.data || calcRes.data;
      setCalcResult(result);

      // Step 2: Fetch order schedules for the period
      const from = resolvedPeriod.scheduleStartDate;
      // Calculate period end date
      let toDate: string;
      if (planningUnit === "MONTH") {
        const d = new Date(targetYear, targetPeriod, 0); // last day of month
        toDate = d.toISOString().split("T")[0];
      } else if (planningUnit === "QUARTER") {
        const endMonth = targetPeriod * 3;
        const d = new Date(targetYear, endMonth, 0);
        toDate = d.toISOString().split("T")[0];
      } else {
        toDate = `${targetYear}-12-31`;
      }

      const schedRes = await inventoryApi.get(`/order-schedules/${productId}`, {
        params: { from, to: toDate },
      });
      const schedules = schedRes.data?.data || schedRes.data || [];
      setOrderSchedules(Array.isArray(schedules) ? schedules : []);
    } catch (err: any) {
      console.error("Calculate/fetch error:", err);
    } finally {
      setCalculating(false);
    }
  };

  const selectedProduct = mockProducts.find((p) => p.id === Number(productId));

  // Period options
  const periodOptions =
    planningUnit === "MONTH"
      ? getMonthOptions(targetYear)
      : planningUnit === "QUARTER"
        ? getQuarterOptions(targetYear)
        : [];

  const yearOptions = getYearOptions();

  const periodSelected =
    targetPeriod !== null &&
    isPeriodValid(planningUnit, targetPeriod, targetYear);

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

      {/* Step 1: Select product & period */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 1: Chọn mặt hàng & kỳ kế hoạch
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>Đơn vị kỳ</Label>
            <Select
              value={planningUnit}
              onValueChange={(v) => setPlanningUnit(v as PlanningUnit)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTH">Tháng</SelectItem>
                <SelectItem value="QUARTER">Quý</SelectItem>
                <SelectItem value="YEAR">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Năm</Label>
            <Select
              value={targetYear.toString()}
              onValueChange={(v) => setTargetYear(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y.value} value={y.value.toString()}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {planningUnit !== "YEAR" && (
            <div className="space-y-2">
              <Label>{planningUnit === "MONTH" ? "Tháng" : "Quý"}</Label>
              <Select
                value={targetPeriod?.toString() || ""}
                onValueChange={(v) => setTargetPeriod(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={`Chọn ${planningUnit === "MONTH" ? "tháng" : "quý"}...`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((opt) => (
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
          )}
        </div>

        {/* Resolve period preview */}
        {resolvingPeriod && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang xác nhận kỳ kế hoạch...
          </div>
        )}

        {resolveError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{resolveError}</p>
          </div>
        )}

        {resolvedPeriod && !resolvingPeriod && (
          <div className="bg-primary/10 border border-primary/30 rounded-md p-3 flex items-start gap-2">
            <CalendarClock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Lịch đặt hàng sẽ bắt đầu từ{" "}
                <span className="font-bold">
                  {new Date(
                    resolvedPeriod.scheduleStartDate,
                  ).toLocaleDateString("vi-VN")}
                </span>
              </p>
              {resolvedPeriod.isCurrentPeriod && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3.5 w-3.5" />
                  Đây là kỳ hiện tại — lịch sẽ bắt đầu từ hôm nay thay vì đầu
                  kỳ.
                </p>
              )}
            </div>
          </div>
        )}

        {productId && periodSelected && (
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

      {/* AI Suggestion panel */}
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

          {suggestion.demandForecast.mapeWarning && (
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
                Q đề xuất ({suggestion.demandForecast.modelUsed})
              </p>
              <p className="font-mono font-medium text-foreground">
                {formatNumber(suggestion.suggestedQ)} {selectedProduct?.unit}
              </p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">K (năng lực cung cấp)</p>
              <p className="font-mono font-medium text-foreground">
                {formatNumber(suggestion.currentSupplyRateK)}{" "}
                {selectedProduct?.unit}/
                {planningUnit === "MONTH"
                  ? "tháng"
                  : planningUnit === "QUARTER"
                    ? "quý"
                    : "năm"}
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

      {/* Step 2: Confirm & Calculate */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 2: Xác nhận tham số & Tính toán
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Q (Nhu cầu tiêu thụ trong kỳ)</Label>
            <Input
              type="number"
              value={demandQ}
              onChange={(e) => setDemandQ(e.target.value)}
              placeholder="Nhập nhu cầu..."
            />
          </div>
          <div className="space-y-2">
            <Label>I (Hệ số bảo quản - theo năm)</Label>
            <Input
              type="number"
              value={storageI}
              onChange={(e) => setStorageI(e.target.value)}
              step="0.001"
            />
          </div>
        </div>
        <Button
          onClick={handleCalculate}
          disabled={calculating || !demandQ || !productId || !periodSelected}
          className="gap-2"
        >
          {calculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Tính toán kế hoạch
        </Button>
      </div>

      {/* Calculation Result Summary */}
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
                value: `${formatNumber(calcResult.optimalOrderQtyS)} ${selectedProduct?.unit || ""}`,
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

      {/* Order Schedule Table */}
      {orderSchedules.length > 0 && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Lịch đặt hàng —{" "}
              {formatPeriodLabel(planningUnit, targetPeriod!, targetYear)}
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
    </div>
  );
}
