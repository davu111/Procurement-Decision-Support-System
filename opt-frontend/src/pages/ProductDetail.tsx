import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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

type PlanningUnit = "MONTH" | "QUARTER" | "YEAR";

// ── constants ──────────────────────────────────────────────────────────────────
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1;
const CURRENT_QUARTER = Math.ceil(CURRENT_MONTH / 3);

// ── pure helpers (không gọi setState, không có side effect) ───────────────────

function getMaxPeriod(unit: PlanningUnit, year: number): number {
  if (unit === "MONTH") return year === CURRENT_YEAR ? CURRENT_MONTH : 12;
  return year === CURRENT_YEAR ? CURRENT_QUARTER : 4; // QUARTER
}

function getPeriodRange(
  unit: PlanningUnit,
  year: number,
  period: number,
): [string, string] {
  if (unit === "YEAR") {
    return [`${year}-01-01`, `${year}-12-31`];
  }
  if (unit === "QUARTER") {
    const startMonth = (period - 1) * 3 + 1;
    const endMonth = period * 3;
    const endDay = new Date(year, endMonth, 0).getDate();
    return [
      `${year}-${String(startMonth).padStart(2, "0")}-01`,
      `${year}-${String(endMonth).padStart(2, "0")}-${endDay}`,
    ];
  }
  // MONTH
  const endDay = new Date(year, period, 0).getDate();
  return [
    `${year}-${String(period).padStart(2, "0")}-01`,
    `${year}-${String(period).padStart(2, "0")}-${endDay}`,
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);

  // ── Product state
  const [product, setProduct] = useState<Product | null>(null);

  // ── Filter state — 3 giá trị độc lập, không có circular dependency
  const [planningUnit, setPlanningUnit] = useState<PlanningUnit>("MONTH");
  const [targetYear, setTargetYear] = useState<number>(CURRENT_YEAR);
  // selectedPeriod: số nguyên (tháng 1-12 hoặc quý 1-4), dùng cho MONTH & QUARTER
  // Với YEAR thì không dùng field này nhưng cũng không cần reset nó
  const [selectedPeriod, setSelectedPeriod] = useState<number>(CURRENT_MONTH);

  // ── Data state
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);
  const [result, setResult] = useState<InventoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [productError, setProductError] = useState(false);

  // ── effectivePeriod: clamp selectedPeriod về giá trị hợp lệ.
  // Đây là giá trị THỰC SỰ dùng để fetch và hiển thị.
  // Không bao giờ gọi setState ở đây — chỉ tính toán thuần.
  const effectivePeriod = useMemo(() => {
    if (planningUnit === "YEAR") return 1; // không dùng, placeholder
    const max = getMaxPeriod(planningUnit, targetYear);
    if (selectedPeriod < 1 || selectedPeriod > max) return max;
    return selectedPeriod;
  }, [planningUnit, targetYear, selectedPeriod]);

  // ── startDate / endDate: stable strings, là deps duy nhất của fetch effect
  const [startDate, endDate] = useMemo(
    () => getPeriodRange(planningUnit, targetYear, effectivePeriod),
    [planningUnit, targetYear, effectivePeriod],
  );

  // ── Handlers: khi người dùng chủ động thay đổi filter
  // Reset selectedPeriod về max hợp lệ khi đổi unit hoặc năm
  const handleUnitChange = (unit: PlanningUnit) => {
    setPlanningUnit(unit);
    if (unit !== "YEAR") {
      setSelectedPeriod(getMaxPeriod(unit, targetYear));
    }
  };

  const handleYearChange = (year: number) => {
    setTargetYear(year);
    if (planningUnit !== "YEAR") {
      setSelectedPeriod(getMaxPeriod(planningUnit, year));
    }
  };

  // ── Load product — chạy lại khi productId thay đổi (client-side navigation)
  useEffect(() => {
    setProduct(null);
    setProductError(false);
    api
      .get(`/inventory-products/${productId}`)
      .then((r) => setProduct(r.data))
      .catch((e) => {
        console.error("Error fetching product:", e);
        setProductError(true); // ← thêm dòng này
      });
  }, [productId]);

  const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), ms),
      ),
    ]);

  useEffect(() => {
    let cancelled = false;
    console.log("Effect fired:", {
      productId,
      planningUnit,
      startDate,
      endDate,
    });

    setLoading(true);
    setNoData(false);
    setResult(null);
    setOrderSchedules([]);

    Promise.all([
      withTimeout(
        api.get(`/inventory-results/range/${productId}`, {
          params: { planningUnit, startDate, endDate },
        }),
      ),

      withTimeout(
        api.get(`/order-schedules/${productId}`, {
          params: { from: startDate, to: endDate },
        }),
      ),
    ])
      .then(([resResult, resSchedules]) => {
        console.log("Promise resolved, cancelled =", cancelled);

        if (cancelled) return;
        const data = resResult.data?.data ?? resResult.data;
        if (!data) {
          setNoData(true);
        } else {
          setResult(data);
          setOrderSchedules(resSchedules.data);
        }
      })
      .catch((e) => {
        console.error("Promise error:", e, "cancelled =", cancelled);
        if (!cancelled) setNoData(true);
      })
      .finally(() => {
        console.log("Finally, cancelled =", cancelled);

        if (!cancelled) setLoading(false);
      });

    return () => {
      console.log("Cleanup called");

      cancelled = true;
    };
  }, [productId, planningUnit, startDate, endDate]);

  // ── Select options ──────────────────────────────────────────────────────────

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = CURRENT_YEAR; y >= 2020; y--) years.push(y);
    return years;
  }, []);

  const periodOptions = useMemo(() => {
    if (planningUnit === "MONTH") {
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const disabled =
          targetYear > CURRENT_YEAR ||
          (targetYear === CURRENT_YEAR && m > CURRENT_MONTH);
        return { value: m, label: `Tháng ${m}`, disabled };
      });
    }
    // QUARTER
    return Array.from({ length: 4 }, (_, i) => {
      const q = i + 1;
      const disabled =
        targetYear > CURRENT_YEAR ||
        (targetYear === CURRENT_YEAR && q > CURRENT_QUARTER);
      return { value: q, label: `Q${q}/${targetYear}`, disabled };
    });
  }, [planningUnit, targetYear]);

  const filterLabel = useMemo(() => {
    if (planningUnit === "YEAR") return `Năm ${targetYear}`;
    if (planningUnit === "QUARTER") return `Q${effectivePeriod}/${targetYear}`;
    return `Tháng ${effectivePeriod}/${targetYear}`;
  }, [planningUnit, targetYear, effectivePeriod]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (productError)
    return (
      <div>
        Không tìm thấy sản phẩm.{" "}
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground animate-pulse">
          Đang tải mặt hàng…
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/")}
        >
          Quay lại
        </Button>
      </div>
    );
  }

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Đơn vị kỳ */}
          <div className="space-y-2">
            <Label>Đơn vị kỳ</Label>
            <Select
              value={planningUnit}
              onValueChange={(v) => handleUnitChange(v as PlanningUnit)}
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

          {/* Tháng / Quý — ẩn khi YEAR */}
          {planningUnit !== "YEAR" && (
            <div className="space-y-2">
              <Label>{planningUnit === "MONTH" ? "Tháng" : "Quý"}</Label>
              <Select
                value={effectivePeriod.toString()}
                onValueChange={(v) => setSelectedPeriod(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
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
      {!loading && !noData && result && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "S* (Lượng đặt tối ưu)",
                value: `${formatNumber(result.optimalOrderQtyS)} ${product.unit}`,
              },
              {
                label: "n* (Số lần đặt)",
                value: formatNumber(result.optimalOrderCountN),
              },
              {
                label: "τ* (Chu kỳ)",
                value: `${formatNumber(result.optimalCycleTimeTau, 4)} kỳ`,
              },
              {
                label: "B (Điểm đặt hàng)",
                value: `${formatNumber(result.reorderPointB)} ${product.unit}`,
              },
              {
                label: "D_min (Chi phí tối thiểu)",
                value: formatCurrency(result.minTotalCost),
              },
            ].map((m) => (
              <div key={m.label} className="bg-card border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Sawtooth Chart */}
          <div className="bg-card border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Biểu đồ tồn kho (Răng cưa) — {filterLabel}
              </h2>
            </div>
            {/* <SawtoothChart result={result} schedules={orderSchedules} /> */}
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
                  {orderSchedules.map((o) => (
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
