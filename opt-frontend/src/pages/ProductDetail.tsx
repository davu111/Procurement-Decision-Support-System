import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Product } from "@/types/inventory-opt/product";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import type { InventoryResult } from "@/types/inventory-opt/inventory-result";
import api from "@/api/axiosConfig";
import { formatCurrency, formatNumber, formatDate } from "@/utils/helpers";
import { ArrowLeft, TrendingUp, CalendarSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SawtoothChart from "@/components/charts/SawtoothChart";

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

// ── helpers ────────────────────────────────────────────────────────────────────
function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
    disabled: false,
  }));
}

function getYearOptions() {
  const years: number[] = [];
  for (let y = CURRENT_YEAR + 1; y >= 2020; y--) years.push(y);
  return years;
}

function validatePeriod(
  startMonth: number,
  endMonth: number,
  _year: number,
): string | null {
  if (startMonth > endMonth)
    return `Tháng bắt đầu (${startMonth}) không thể lớn hơn tháng kết thúc (${endMonth})`;
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);

  // ── Product state ──────────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);
  const [productError, setProductError] = useState(false);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [startMonth, setStartMonth] = useState<number>(CURRENT_MONTH);
  const [endMonth, setEndMonth] = useState<number>(CURRENT_MONTH);
  const [targetYear, setTargetYear] = useState<number>(CURRENT_YEAR);

  // ── Resolved period (từ /resolve-period) ──────────────────────────────────
  const [resolvedPeriod, setResolvedPeriod] = useState<ResolvedPeriod | null>(
    null,
  );
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [resolvingPeriod, setResolvingPeriod] = useState(false);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [results, setResults] = useState<InventoryResult[]>([]);
  const [schedules, setSchedules] = useState<OrderSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  // ── Validate period client-side ────────────────────────────────────────────
  const clientValidationError = useMemo(
    () => validatePeriod(startMonth, endMonth, targetYear),
    [startMonth, endMonth, targetYear],
  );

  // ── Debounce resolve-period ────────────────────────────────────────────────
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allSchedulesSorted = schedules
    .slice()
    .sort((a, b) => a.orderDate.localeCompare(b.orderDate));

  useEffect(() => {
    // Nếu client-side validation fail thì không gọi API
    if (clientValidationError) {
      setPeriodError(clientValidationError);
      setResolvedPeriod(null);
      return;
    }

    setPeriodError(null);

    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);

    resolveTimerRef.current = setTimeout(() => {
      setResolvingPeriod(true);
      api
        .get("/inventory/resolve-period", {
          params: { startMonth, endMonth, year: targetYear, mode: "history" },
        })
        .then((res: any) => {
          console.log("resolve-period response:", res); // ← thêm dòng này

          setResolvedPeriod(res.data);
          setPeriodError(null);
        })
        .catch((e: Error) => {
          setPeriodError(e.message);
          setResolvedPeriod(null);
        })
        .finally(() => setResolvingPeriod(false));
    }, 300);

    return () => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    };
  }, [startMonth, endMonth, targetYear, clientValidationError]);

  // ── Load product ───────────────────────────────────────────────────────────
  useEffect(() => {
    setProduct(null);
    setProductError(false);
    api
      .get(`/inventory-products/${productId}`)
      .then((res: any) => setProduct(res.data))
      .catch(() => setProductError(true));
  }, [productId]);

  // ── Load result + schedules — chỉ chạy khi resolvedPeriod hợp lệ ──────────
  useEffect(() => {
    console.log(
      "Triggering data load for productId:",
      productId,
      "with resolvedPeriod:",
      resolvedPeriod,
    );
    if (!resolvedPeriod) return;

    const { planStartDate, planEndDate } = resolvedPeriod;
    let cancelled = false;

    setLoading(true);
    setNoData(false);
    setResults([]);
    setSchedules([]);

    Promise.all([
      api.get(`/inventory-results/range/${productId}`, {
        params: { startDate: planStartDate, endDate: planEndDate },
      }),
      api.get(`/order-schedules/${productId}`, {
        params: { from: planStartDate, to: planEndDate },
      }),
    ])
      .then(([resResult, resSchedules]: any[]) => {
        if (cancelled) return;
        // API trả array of results
        const rawResults: InventoryResult[] = resResult.data;
        const rawSchedules: OrderSchedule[] = resSchedules.data ?? [];
        console.log(
          "Loaded inventory results:",
          rawResults,
          "and order schedules:",
          rawSchedules,
        );

        if (!rawResults || rawResults.length === 0) {
          setNoData(true);
        } else {
          setResults(rawResults);
          setSchedules(rawSchedules);
        }
      })
      .catch(() => {
        if (!cancelled) setNoData(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, resolvedPeriod]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleYearChange = useCallback((year: number) => {
    setTargetYear(year);
    // Clamp startMonth/endMonth về tháng hợp lệ nếu chọn năm hiện tại
    if (year === CURRENT_YEAR) {
      setStartMonth((prev) => Math.max(prev, CURRENT_MONTH));
      setEndMonth((prev) => Math.max(prev, CURRENT_MONTH));
    }
  }, []);

  const handleStartMonthChange = useCallback(
    (month: number) => {
      setStartMonth(month);
      // endMonth không được nhỏ hơn startMonth mới
      if (endMonth < month) setEndMonth(month);
    },
    [endMonth],
  );

  // ── Options ────────────────────────────────────────────────────────────────
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

  // ── Render guards ──────────────────────────────────────────────────────────
  if (productError)
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm.</p>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground animate-pulse">
          Đang tải mặt hàng…
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  const filterLabel =
    resolvedPeriod?.label ?? `Tháng ${startMonth}–${endMonth}/${targetYear}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">
            {product.code} · {product.unit}
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarSearch className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Kỳ kế hoạch</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              onValueChange={(v) => setEndMonth(Number(v))}
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

        {/* Period preview */}
        {resolvingPeriod && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Đang xác minh kỳ…
          </p>
        )}
        {!resolvingPeriod && periodError && (
          <p className="text-xs text-destructive">{periodError}</p>
        )}
        {/* {!resolvingPeriod && resolvedPeriod && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>
              📅{" "}
              <span className="font-medium text-foreground">
                {resolvedPeriod.label}
              </span>{" "}
              ({resolvedPeriod.planStartDate} → {resolvedPeriod.planEndDate})
            </p>
            <div>
              🚚 Lịch đặt hàng bắt đầu từ:{" "}
              <span className="font-medium text-foreground">
                {resolvedPeriod.scheduleStartDate}
              </span>
              {resolvedPeriod.isCurrentMonth && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Tháng hiện tại
                </Badge>
              )}
            </div>
          </div>
        )} */}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm animate-pulse">
            Đang tải dữ liệu kỳ {filterLabel}…
          </p>
        </div>
      )}

      {/* No data */}
      {!loading && noData && (
        <div className="bg-card border rounded-lg flex flex-col items-center justify-center py-16 gap-3">
          <CalendarSearch className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-medium text-foreground">
            Không có kế hoạch cho {filterLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng chọn kỳ khác hoặc kiểm tra lại dữ liệu.
          </p>
        </div>
      )}

      {/* Main content */}
      {!loading && !noData && results.length > 0 && (
        <>
          {/* Sawtooth Chart */}
          <div className="bg-card border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Biểu đồ tồn kho (Răng cưa) — {filterLabel}
              </h2>
            </div>
            {console.log(
              "Rendering SawtoothChart with results:",
              results,
              "and schedules:",
              schedules,
            )}
            <SawtoothChart results={results} schedules={schedules} />
          </div>

          {/* Order schedule table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-foreground">
                Lịch đặt hàng — {filterLabel}
              </h2>
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
                      Ngày giao
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Số lượng
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Chi phí
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allSchedulesSorted.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono">
                        #{o.orderSequence}
                      </td>
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
        </>
      )}
    </div>
  );
}
