import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Product } from "@/types/inventory-opt/product";
import type {
  OrderSchedule,
  OrderScheduleChain,
} from "@/types/inventory-opt/order-schedule";
import type { InventoryResult } from "@/types/inventory-opt/inventory-result";
import api from "@/api/axiosConfig";
import { formatCurrency, formatNumber, formatDate } from "@/utils/helpers";
import { ArrowLeft, TrendingUp, CalendarSearch, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  const [schedules, setSchedules] = useState<OrderScheduleChain[]>([]);
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
      .get(`/products/${productId}`)
      .then((res: any) => setProduct(res.data))
      .catch(() => setProductError(true));
  }, [productId]);

  // ── Load result + schedules ────────────────────────────────────────────────
  useEffect(() => {
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
      api.get(`/order-schedules/product/${productId}/chain`),
    ])
      .then(([resResult, resSchedules]: any[]) => {
        if (cancelled) return;
        const rawResults: InventoryResult[] = resResult.data;
        const rawSchedules: OrderScheduleChain[] =
          resSchedules.data.schedules ?? [];

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
    if (year === CURRENT_YEAR) {
      setStartMonth((prev) => Math.max(prev, CURRENT_MONTH));
      setEndMonth((prev) => Math.max(prev, CURRENT_MONTH));
    }
  }, []);

  const handleStartMonthChange = useCallback(
    (month: number) => {
      setStartMonth(month);
      if (endMonth < month) setEndMonth(month);
    },
    [endMonth],
  );

  // ── Options ────────────────────────────────────────────────────────────────
  const yearOptions = useMemo(() => getYearOptions(), []);
  const monthOptions = useMemo(() => getMonthOptions(), []);

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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Package2 className="h-16 w-16 text-gray-200" />
        <p className="text-gray-500 text-lg font-medium">Không tìm thấy sản phẩm.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );

  if (!product)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Đang tải mặt hàng…</p>
      </div>
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  const filterLabel =
    resolvedPeriod?.label ?? `Tháng ${startMonth}–${endMonth}/${targetYear}`;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">
            {product.productName}
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            {product.code} · {product.unit}
          </p>
        </div>
      </div>

      {/* ── Filter Panel ────────────────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarSearch className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Kỳ kế hoạch</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Năm */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Năm</Label>
            <Select
              value={targetYear.toString()}
              onValueChange={(v) => handleYearChange(Number(v))}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
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
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Từ tháng</Label>
            <Select
              value={startMonth.toString()}
              onValueChange={(v) => handleStartMonthChange(Number(v))}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
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
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Đến tháng</Label>
            <Select
              value={endMonth.toString()}
              onValueChange={(v) => setEndMonth(Number(v))}
            >
              <SelectTrigger className="rounded-xl border-gray-200">
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

        {/* Status messages */}
        {resolvingPeriod && (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-xs text-gray-400">Đang xác minh kỳ…</p>
          </div>
        )}
        {!resolvingPeriod && periodError && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {periodError}
          </p>
        )}
        {!resolvingPeriod && resolvedPeriod && (
          <p className="text-xs text-gray-400">
            Kỳ đã chọn:{" "}
            <span className="font-medium text-gray-600">{resolvedPeriod.label}</span>
            {" "}({resolvedPeriod.planStartDate} → {resolvedPeriod.planEndDate})
          </p>
        )}
      </Card>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-gray-400 text-sm">
            Đang tải dữ liệu kỳ <span className="font-medium text-gray-600">{filterLabel}</span>…
          </p>
        </Card>
      )}

      {/* ── No data ─────────────────────────────────────────────────────────── */}
      {!loading && noData && (
        <Card className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <CalendarSearch className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-base font-semibold font-display text-gray-900">
            Không có kế hoạch cho {filterLabel}
          </p>
          <p className="text-sm text-gray-400">
            Vui lòng chọn kỳ khác hoặc kiểm tra lại dữ liệu.
          </p>
        </Card>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {!loading && !noData && results.length > 0 && (
        <>
          {/* Sawtooth Chart */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold font-display text-gray-900">
                  Biểu đồ tồn kho dự đoán
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{filterLabel}</p>
              </div>
            </div>
            <SawtoothChart results={results} schedules={schedules} />
          </Card>

          {/* Order schedule table */}
          <Card className="p-0 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-semibold font-display text-gray-900">
                Lịch đặt hàng
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{filterLabel} · {allSchedulesSorted.length} lần đặt</p>
            </div>

            {allSchedulesSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm text-gray-400">Chưa có lịch đặt hàng</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Lần
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Ngày đặt
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Ngày giao
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Số lượng
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Chi phí
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allSchedulesSorted.map((o, idx) => (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                            #{o.orderSequence}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(o.orderDate)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(o.expectedDeliveryDate)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900">
                          {formatNumber(o.orderQuantity)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-700">
                          {formatCurrency(o.estimatedCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
