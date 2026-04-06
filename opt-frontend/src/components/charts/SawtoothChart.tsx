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
    const empty = {
      mergedData: [] as ChartPoint[],
      leadTimeAreas: [] as { from: number; to: number }[],
      stockoutAreas: [] as { from: number; to: number }[],
      maxY: 0,
    };

    if (schedules.length === 0) return empty;

    const sorted = [...schedules].sort(
      (a, b) =>
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
    );

    const maxLevel = result.maxInventoryLevel;
    const B = result.reorderPointB;

    // ── Guard: data không hợp lệ ──────────────────────────────────────────
    if (!maxLevel || !B || maxLevel <= 0) return empty;

    const lDays = daysBetween(
      sorted[0].expectedDeliveryDate,
      sorted[0].orderDate,
    );
    if (lDays <= 0) return empty; // orderDate >= deliveryDate → data lỗi

    const tauDays =
      sorted.length >= 2
        ? daysBetween(sorted[1].orderDate, sorted[0].orderDate)
        : Math.round((result.optimalCycleTimeTau / result.leadTimeL) * lDays);

    if (tauDays <= 0) return empty; // 2 order cùng ngày → không vẽ được

    const daysPerPeriod =
      result.leadTimeL > 0 ? Math.round(lDays / result.leadTimeL) : 30;

    const tnDays = Math.max(
      1,
      Math.round(result.replenishmentTimeTn * daysPerPeriod),
    );
    const ttDays = Math.max(1, tauDays - tnDays);

    const dailyRiseNet = maxLevel / tnDays;
    const dailyFall = maxLevel / ttDays;
    const invAtDeliv = Math.max(0, B - dailyFall * lDays);

    const refDateStr = sorted[0].orderDate;
    const toDayIdx = (dateStr: string) => daysBetween(dateStr, refDateStr);

    const cycleBreakpoints = sorted.map((s) => ({
      orderIdx: toDayIdx(s.orderDate),
      delivIdx: toDayIdx(s.expectedDeliveryDate),
      peakIdx: toDayIdx(s.expectedDeliveryDate) + tnDays,
      isWarning: s.isReorderWarning,
    }));

    // ── Guard: chartEnd không được quá lớn ────────────────────────────────
    const chartStart = cycleBreakpoints[0].orderIdx;
    const lastCycle = cycleBreakpoints[cycleBreakpoints.length - 1];
    const chartEnd = lastCycle.peakIdx + ttDays + 5;

    const MAX_POINTS = 3650; // tối đa ~10 năm ngày, thực tế 1 kỳ << 365
    if (chartEnd - chartStart > MAX_POINTS) return empty;

    const orderDayMap = new Map<number, boolean>();
    const delivDaySet = new Set<number>();
    for (const { orderIdx, delivIdx, isWarning } of cycleBreakpoints) {
      orderDayMap.set(orderIdx, isWarning);
      delivDaySet.add(delivIdx);
    }

    const points: ChartPoint[] = [];
    let cycleIdx = 0;
    console.log("Chart params:", {
      lDays,
      tauDays,
      tnDays,
      ttDays,
      chartStart,
      chartEnd,
    });

    for (let idx = chartStart; idx <= chartEnd; idx++) {
      // ── Fix Bug 2: dùng for thay while để tránh infinite loop ────────────
      for (
        let next = cycleIdx + 1;
        next < cycleBreakpoints.length &&
        idx >= cycleBreakpoints[next].orderIdx;
        next++
      ) {
        cycleIdx = next;
      }

      const { orderIdx, delivIdx, peakIdx } = cycleBreakpoints[cycleIdx];

      let inv: number;
      if (idx < orderIdx) {
        inv = B;
      } else if (idx < delivIdx) {
        inv = Math.max(0, B - dailyFall * (idx - orderIdx));
      } else if (idx < peakIdx) {
        inv = Math.min(maxLevel, invAtDeliv + dailyRiseNet * (idx - delivIdx));
      } else {
        inv = Math.max(0, maxLevel - dailyFall * (idx - peakIdx));
      }

      inv = Math.round(inv * 100) / 100;

      const pt: ChartPoint = {
        dayIndex: idx,
        date: addDaysStr(refDateStr, idx),
        inventory: inv,
      };

      if (orderDayMap.has(idx)) {
        pt.orderMarker = B;
        pt.isWarning = orderDayMap.get(idx);
      }
      if (delivDaySet.has(idx)) {
        pt.deliveryMarker = inv;
      }

      points.push(pt);
    }

    // ── Lead time areas ──────────────────────────────────────────────────────
    const ltAreas = cycleBreakpoints.map(({ orderIdx, delivIdx }) => ({
      from: orderIdx,
      to: delivIdx,
    }));

    // ── Stockout areas ───────────────────────────────────────────────────────
    const soAreas: { from: number; to: number }[] = [];
    let inStockout = false;
    let stockoutStart = 0;
    for (const pt of points) {
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
      mergedData: points,
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

  const minDay = mergedData[0].dayIndex;
  const maxDay = mergedData[mergedData.length - 1].dayIndex;
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
            // O(1): tính ngày trực tiếp từ offset, không dùng .find
            return fmtDate(
              addDaysStr(mergedData[0].date, val - mergedData[0].dayIndex),
            );
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
            key={`so-${i}`}
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
