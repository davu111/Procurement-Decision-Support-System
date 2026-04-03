import { useMemo } from "react";
import { InventoryResult, OrderSchedule } from "@/types";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
} from "recharts";

interface SawtoothChartProps {
  result: InventoryResult;
  schedules: OrderSchedule[];
}

function daysBetween(d1: string, d2: string): number {
  return Math.round(
    (new Date(d1).getTime() - new Date(d2).getTime()) / 86400000,
  );
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface ChartPoint {
  dayIndex: number;
  date: string;
  inventory: number;
  orderMarker?: number;
  deliveryMarker?: number;
  isWarning?: boolean;
}

const OrderMarkerShape = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const color = payload?.isWarning ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)";
  return (
    <g>
      <polygon
        points={`${cx},${cy + 4} ${cx - 7},${cy - 8} ${cx + 7},${cy - 8}`}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const DeliveryMarkerShape = (props: any) => {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  const color = "hsl(142 71% 35%)";
  return (
    <g>
      <polygon
        points={`${cx},${cy - 4} ${cx - 7},${cy + 8} ${cx + 7},${cy + 8}`}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export default function SawtoothChart({
  result,
  schedules,
}: SawtoothChartProps) {
  const { mergedData, leadTimeAreas, stockoutAreas, maxY } = useMemo(() => {
    if (schedules.length === 0) {
      return {
        mergedData: [],
        leadTimeAreas: [] as { from: number; to: number }[],
        stockoutAreas: [] as { from: number; to: number }[],
        maxY: 0,
      };
    }

    const sorted = [...schedules].sort(
      (a, b) =>
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
    );

    const firstSched = sorted[0];
    const maxLevel = result.maxInventoryLevel;
    const B = result.reorderPointB;
    const Z = result.avgInventoryLevel;

    // L (lead time) tính theo ngày thực tế từ schedule
    const lDays = daysBetween(
      firstSched.expectedDeliveryDate,
      firstSched.orderDate,
    );

    // τ (cycle time) tính theo khoảng cách giữa 2 orderDate liên tiếp
    const tauDays =
      sorted.length >= 2
        ? daysBetween(sorted[1].orderDate, sorted[0].orderDate)
        : Math.round((result.optimalCycleTimeTau / result.leadTimeL) * lDays);

    const daysPerPeriod =
      result.leadTimeL > 0 ? Math.round(lDays / result.leadTimeL) : 30;
    const tnDays = Math.round(result.replenishmentTimeTn * daysPerPeriod);
    // Tt = τ - Tn: thời gian tiêu thụ thuần (không nhận hàng)
    const ttDays = Math.max(1, tauDays - tnDays);

    // Tốc độ thay đổi tồn kho theo lý thuyết bổ sung dần:
    // - Trong Tn ngày nhận hàng: tồn kho TĂNG từ 0 lên maxLevel
    //   => tốc độ tăng ròng = maxLevel / tnDays (đã trừ tiêu thụ trong Tn)
    // - Trong Tt ngày tiêu thụ thuần: tồn kho GIẢM từ maxLevel về 0
    //   => tốc độ giảm = maxLevel / ttDays
    // Theo lý thuyết: Tn < Tt nên sườn trái (tăng) thoải hơn sườn phải (giảm)
    // khi lDays > tauDays/2 (L dài). Ngược lại sườn trái dốc hơn.
    const dailyRiseNet = maxLevel / tnDays;
    const dailyFall = maxLevel / ttDays;

    const refDateStr = sorted[0].orderDate;
    const toDayIndex = (dateStr: string) => daysBetween(dateStr, refDateStr);

    // Xây dựng map: dayIndex => loại ngày (nhận hàng hay không)
    type ReceivingWindow = { start: number; end: number };
    const receivingWindows: ReceivingWindow[] = sorted.map((s) => {
      const delivIdx = toDayIndex(s.expectedDeliveryDate);
      return { start: delivIdx, end: delivIdx + tnDays - 1 };
    });

    const allOrderIdx = sorted.map((s) => toDayIndex(s.orderDate));
    const allDeliveryIdx = sorted.map((s) =>
      toDayIndex(s.expectedDeliveryDate),
    );
    const chartStart = Math.min(...allOrderIdx) - 1;
    const lastDelivIdx = Math.max(...allDeliveryIdx);
    const chartEnd = lastDelivIdx + tnDays + ttDays + 5;

    const rawPoints = new Map<number, ChartPoint>();

    const setPoint = (
      dayIndex: number,
      date: string,
      inventory: number,
      extra?: Partial<ChartPoint>,
    ) => {
      const existing = rawPoints.get(dayIndex);
      if (existing) {
        rawPoints.set(dayIndex, { ...existing, ...extra });
      } else {
        rawPoints.set(dayIndex, { dayIndex, date, inventory, ...extra });
      }
    };

    // APPROACH: Tính inventory theo công thức tuyến tính cho từng đoạn của mỗi chu kỳ
    //
    // Mỗi chu kỳ τ gồm 2 đoạn:
    //   Đoạn 1 — Lead time [orderDate, deliveryDate): tồn kho GIẢM từ B xuống
    //     inv(t) = B - dailyFall * t  (t = số ngày kể từ orderDate)
    //   Đoạn 2 — Nhận hàng [deliveryDate, deliveryDate+Tn): tồn kho TĂNG lên maxLevel
    //     inv(t) = inv(deliveryDate) + dailyRiseNet * t
    //   Đoạn 3 — Tiêu thụ thuần [deliveryDate+Tn, orderDate tiếp theo): giảm từ maxLevel về B
    //     inv(t) = maxLevel - dailyFall * t
    //
    // Điều này ĐẢM BẢO:
    //   - orderDate luôn có inventory = B (anchor point)
    //   - Đỉnh tam giác luôn = maxLevel
    //   - Không có sai số tích lũy qua các chu kỳ

    // Tập hợp tất cả breakpoints (ngày quan trọng) để tính giá trị chính xác
    const anchorPoints = new Map<number, number>(); // dayIndex => inventory

    for (const sched of sorted) {
      const orderIdx = toDayIndex(sched.orderDate);
      const delivIdx = toDayIndex(sched.expectedDeliveryDate);
      const peakIdx = delivIdx + tnDays;

      // Anchor: orderDate luôn = B (định nghĩa của điểm tái đặt hàng)
      anchorPoints.set(orderIdx, B);

      // Tại deliveryDate: tồn kho đã giảm thêm L ngày kể từ orderDate
      const invAtDeliv = Math.max(0, B - dailyFall * lDays);
      anchorPoints.set(delivIdx, invAtDeliv);

      // Tại đỉnh (deliveryDate + Tn): tồn kho đạt maxLevel
      anchorPoints.set(peakIdx, maxLevel);
    }

    // Hàm nội suy inventory tại bất kỳ ngày nào dựa trên chu kỳ chứa nó
    const getInventory = (idx: number): number => {
      // Tìm chu kỳ phù hợp: orderDate <= idx < orderDate tiếp theo
      for (let i = 0; i < sorted.length; i++) {
        const orderIdx = toDayIndex(sorted[i].orderDate);
        const delivIdx = toDayIndex(sorted[i].expectedDeliveryDate);
        const peakIdx = delivIdx + tnDays;
        const nextOrderIdx =
          i + 1 < sorted.length
            ? toDayIndex(sorted[i + 1].orderDate)
            : orderIdx + tauDays;

        if (idx < orderIdx) continue;
        if (idx >= nextOrderIdx && i < sorted.length - 1) continue;

        if (idx >= orderIdx && idx < delivIdx) {
          // Đoạn 1: Lead time — giảm từ B
          return Math.max(0, B - dailyFall * (idx - orderIdx));
        } else if (idx >= delivIdx && idx < peakIdx) {
          // Đoạn 2: Nhận hàng — tăng từ invAtDeliv
          const invAtDeliv = Math.max(0, B - dailyFall * lDays);
          return Math.min(
            maxLevel,
            invAtDeliv + dailyRiseNet * (idx - delivIdx),
          );
        } else if (idx >= peakIdx) {
          // Đoạn 3: Tiêu thụ thuần — giảm từ maxLevel về B
          return Math.max(0, maxLevel - dailyFall * (idx - peakIdx));
        }
      }
      return 0;
    };

    for (let idx = chartStart; idx <= chartEnd; idx++) {
      const date = addDaysStr(refDateStr, idx);
      const inv = Math.round(getInventory(idx) * 100) / 100;

      const orderSched = sorted.find((s) => toDayIndex(s.orderDate) === idx);
      const deliverySched = sorted.find(
        (s) => toDayIndex(s.expectedDeliveryDate) === idx,
      );

      const extra: Partial<ChartPoint> = {};
      if (orderSched) {
        // orderMarker luôn = B vì đây là định nghĩa điểm đặt hàng
        extra.orderMarker = B;
        extra.isWarning = orderSched.isReorderWarning;
      }
      if (deliverySched) {
        extra.deliveryMarker = inv;
      }

      setPoint(idx, date, inv, extra);
    }

    // Lead time areas
    const ltAreas: { from: number; to: number }[] = sorted.map((s) => ({
      from: toDayIndex(s.orderDate),
      to: toDayIndex(s.expectedDeliveryDate),
    }));

    // Stockout areas
    const soAreas: { from: number; to: number }[] = [];
    let inStockout = false;
    let stockoutStart = 0;
    const sortedPts = Array.from(rawPoints.values()).sort(
      (a, b) => a.dayIndex - b.dayIndex,
    );
    for (const pt of sortedPts) {
      if (pt.inventory === 0 && !inStockout) {
        inStockout = true;
        stockoutStart = pt.dayIndex;
      } else if (pt.inventory > 0 && inStockout) {
        soAreas.push({ from: stockoutStart, to: pt.dayIndex });
        inStockout = false;
      }
    }

    const maxY = Math.max(maxLevel, B) * 1.2;

    return {
      mergedData: sortedPts,
      leadTimeAreas: ltAreas,
      stockoutAreas: soAreas,
      maxY,
    };
  }, [result, schedules]);

  if (mergedData.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu</p>
    );
  }

  const maxLevel = result.maxInventoryLevel;
  const B = result.reorderPointB;
  const Z = result.avgInventoryLevel;

  const allDayIndices = mergedData.map((d) => d.dayIndex);
  const minDay = Math.min(...allDayIndices);
  const maxDay = Math.max(...allDayIndices);
  const totalDays = maxDay - minDay;
  const tickStep = Math.max(1, Math.ceil(totalDays / 12));

  const ticks: number[] = [];
  for (let d = minDay; d <= maxDay; d += tickStep) ticks.push(d);

  return (
    <ResponsiveContainer width="100%" height={440}>
      <ComposedChart
        data={mergedData}
        margin={{ top: 20, right: 80, bottom: 40, left: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />

        <XAxis
          dataKey="dayIndex"
          type="number"
          domain={[minDay - 1, maxDay + 1]}
          ticks={ticks}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(val) => {
            const point = mergedData.find((p) => p.dayIndex === val);
            if (point) return fmtDate(point.date);
            if (mergedData.length > 0)
              return fmtDate(
                addDaysStr(mergedData[0].date, val - mergedData[0].dayIndex),
              );
            return "";
          }}
          label={{
            value: "Thời gian",
            position: "bottom",
            offset: 20,
            style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
          }}
        />

        <YAxis
          domain={[0, Math.ceil(maxY)]}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          label={{
            value: "Tồn kho",
            angle: -90,
            position: "insideLeft",
            offset: -5,
            style: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
          }}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0]?.payload as ChartPoint;
            if (!p) return null;
            return (
              <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                <p className="font-medium text-foreground mb-1">
                  {new Date(p.date).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-muted-foreground">
                  Tồn kho:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {p.inventory.toLocaleString("vi-VN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
                {p.orderMarker !== undefined && (
                  <p className="text-destructive font-medium mt-1">
                    📦 Ngày đặt hàng {p.isWarning ? "⚠️ Tràn kỳ" : ""}
                  </p>
                )}
                {p.deliveryMarker !== undefined && (
                  <p className="text-emerald-600 font-medium mt-1">
                    🚚 Ngày nhận hàng
                  </p>
                )}
              </div>
            );
          }}
        />

        {stockoutAreas.map((area, i) => (
          <ReferenceArea
            key={`stockout-${i}`}
            x1={area.from}
            x2={area.to}
            fill="hsl(0 72% 51%)"
            fillOpacity={0.12}
            strokeOpacity={0}
          />
        ))}

        {leadTimeAreas.map((area, i) => (
          <ReferenceArea
            key={`lt-${i}`}
            x1={area.from}
            x2={area.to}
            fill="hsl(215 70% 50%)"
            fillOpacity={0.06}
            strokeOpacity={0}
          />
        ))}

        <ReferenceLine
          y={maxLevel}
          stroke="hsl(142 71% 35%)"
          strokeDasharray="8 4"
          strokeWidth={1.5}
          label={{
            value: `S*(1−Q/K) = ${maxLevel.toFixed(0)}`,
            position: "right",
            fill: "hsl(142 71% 35%)",
            fontSize: 10,
          }}
        />

        <ReferenceLine
          y={Z}
          stroke="hsl(38 92% 50%)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: `Z = ${Z.toFixed(0)}`,
            position: "right",
            fill: "hsl(38 92% 50%)",
            fontSize: 10,
          }}
        />

        <ReferenceLine
          y={B}
          stroke="hsl(0 72% 51%)"
          strokeDasharray="8 4"
          strokeWidth={1.5}
          label={{
            value: `B = ${B.toFixed(0)}`,
            position: "right",
            fill: "hsl(0 72% 51%)",
            fontSize: 10,
          }}
        />

        <Line
          dataKey="inventory"
          type="linear"
          stroke="hsl(215 70% 50%)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(215 70% 50%)" }}
          connectNulls
        />

        <Scatter dataKey="orderMarker" shape={<OrderMarkerShape />} />
        <Scatter dataKey="deliveryMarker" shape={<DeliveryMarkerShape />} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
