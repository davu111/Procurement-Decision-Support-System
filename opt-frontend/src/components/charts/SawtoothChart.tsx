import { useMemo } from "react";
import type { InventoryResult } from "@/types/inventory-opt/inventory-result";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
} from "recharts";

// ── Props ──────────────────────────────────────────────────────────────────────

interface SawtoothChartProps {
  results: InventoryResult[]; // mỗi kế hoạch 1 result, có thể 1 hoặc nhiều
  schedules: OrderSchedule[]; // tất cả schedules trong range, có inventoryResultId
}

// ── Internal types ─────────────────────────────────────────────────────────────

interface ChartPoint {
  dayIndex: number;
  date: string;
  inventory: number;
  orderMarker?: number;
  deliveryMarker?: number;
  isWarning?: boolean;
  segmentB?: number;
}

interface AreaBand {
  from: number;
  to: number;
}

interface BuiltSegment {
  result: InventoryResult;
  points: ChartPoint[];
  leadTimeAreas: AreaBand[];
  stockoutAreas: AreaBand[];
  chartStart: number;
  chartEnd: number;
  color: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysBetween(d1: string, d2: string): number {
  // Math.floor thay vì Math.round để tránh lệch ngày giao hàng
  return Math.floor(
    (new Date(d1).getTime() - new Date(d2).getTime()) / 86400000,
  );
}

function addDaysStr(refDate: string, days: number): string {
  const d = new Date(refDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const SEGMENT_COLORS = [
  "hsl(215 70% 50%)",
  "hsl(142 60% 40%)",
  "hsl(280 60% 55%)",
  "hsl(25 80% 50%)",
  "hsl(340 70% 50%)",
];

// ── Marker shapes ──────────────────────────────────────────────────────────────

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
  return (
    <g>
      <polygon
        points={`${cx},${cy - 4} ${cx - 7},${cy + 8} ${cx + 7},${cy + 8}`}
        fill="hsl(142 71% 35%)"
        stroke="hsl(142 71% 35%)"
        strokeWidth={1}
      />
    </g>
  );
};

// ── Build chart points cho 1 segment ──────────────────────────────────────────

function buildSegment(
  result: InventoryResult,
  schedules: OrderSchedule[],
  refDateStr: string,
  color: string,
): BuiltSegment | null {
  if (schedules.length === 0) return null;

  const sorted = [...schedules].sort(
    (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
  );

  const maxLevel = result.maxInventoryLevel;
  const B = result.reorderPointB;
  if (!maxLevel || !B || maxLevel <= 0) return null;

  const toDayIdx = (d: string) => daysBetween(d, refDateStr);

  const lDays = daysBetween(
    sorted[0].expectedDeliveryDate,
    sorted[0].orderDate,
  );
  if (lDays <= 0) return null;

  const tauDays =
    sorted.length >= 2
      ? daysBetween(sorted[1].orderDate, sorted[0].orderDate)
      : Math.round(
          (result.optimalCycleTimeTau / Math.max(result.leadTimeL, 0.001)) *
            lDays,
        );
  if (tauDays <= 0) return null;

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

  const cycleBreakpoints = sorted.map((s) => ({
    orderIdx: toDayIdx(s.orderDate),
    delivIdx: toDayIdx(s.expectedDeliveryDate),
    peakIdx: toDayIdx(s.expectedDeliveryDate) + tnDays,
    isWarning: s.isReorderWarning,
  }));

  const chartStart = cycleBreakpoints[0].orderIdx;
  const lastCycle = cycleBreakpoints[cycleBreakpoints.length - 1];
  const chartEnd = lastCycle.peakIdx + ttDays + 2;

  if (chartEnd - chartStart > 3650) return null;

  const orderDayMap = new Map<number, boolean>();
  const delivDaySet = new Set<number>();
  for (const { orderIdx, delivIdx, isWarning } of cycleBreakpoints) {
    orderDayMap.set(orderIdx, isWarning);
    delivDaySet.add(delivIdx);
  }

  const points: ChartPoint[] = [];
  let cycleIdx = 0;

  for (let idx = chartStart; idx <= chartEnd; idx++) {
    for (
      let next = cycleIdx + 1;
      next < cycleBreakpoints.length && idx >= cycleBreakpoints[next].orderIdx;
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
      segmentB: B,
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

  // Lead time areas
  const leadTimeAreas: AreaBand[] = cycleBreakpoints.map(
    ({ orderIdx, delivIdx }) => ({ from: orderIdx, to: delivIdx }),
  );

  // Stockout areas
  const stockoutAreas: AreaBand[] = [];
  let inStockout = false;
  let stockoutStart = 0;
  for (const pt of points) {
    if (pt.inventory === 0 && !inStockout) {
      inStockout = true;
      stockoutStart = pt.dayIndex;
    } else if (pt.inventory > 0 && inStockout) {
      stockoutAreas.push({ from: stockoutStart, to: pt.dayIndex });
      inStockout = false;
    }
  }

  return {
    result,
    points,
    leadTimeAreas,
    stockoutAreas,
    chartStart,
    chartEnd,
    color,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SawtoothChart({
  results,
  schedules,
}: SawtoothChartProps) {
  const computed = useMemo(() => {
    if (results.length === 0 || schedules.length === 0) return null;

    // ── Bước 1: Group schedules theo inventoryResultId ──────────────────────
    // Dùng inventoryResultId từ schedule làm key — đây là nguồn sự thật duy nhất.
    const schedulesByResultId = new Map<number, OrderSchedule[]>();
    for (const s of schedules) {
      const rid: number | undefined =
        (s as any).inventoryResultId ?? (s as any).inventoryParameterId;
      if (rid == null) continue;
      if (!schedulesByResultId.has(rid)) schedulesByResultId.set(rid, []);
      schedulesByResultId.get(rid)!.push(s);
    }

    // ── Bước 2: Với mỗi result, tìm schedules match bằng cách thử các field id ──
    // Không giả định tên field id của InventoryResult — thử tất cả candidates.
    function getResultId(r: InventoryResult): number | undefined {
      const candidates = [
        "id",
        "parameterId",
        "inventoryParameterId",
        "resultId",
      ];
      for (const key of candidates) {
        const v = (r as any)[key];
        if (v != null && typeof v === "number") return v;
      }
      return undefined;
    }

    // ── Bước 3: Match result ↔ schedules ──────────────────────────────────────
    // Nếu không tìm được id từ result, fallback dùng inventoryResultId
    // của schedules để match trực tiếp (so sánh ngược).
    const resultWithSchedules: Array<{
      result: InventoryResult;
      segs: OrderSchedule[];
    }> = results.map((r) => {
      const rid = getResultId(r);
      if (rid != null && schedulesByResultId.has(rid)) {
        return { result: r, segs: schedulesByResultId.get(rid)! };
      }
      // Fallback: result không có id khớp với schedulesByResultId
      // → thử tìm ngược: schedules nào chưa được claim bởi result khác
      // Đây là trường hợp backend không trả id trên InventoryResult
      return { result: r, segs: [] };
    });

    // Nếu tất cả segs đều rỗng (backend không trả id trên result),
    // fallback an toàn: 1 result → tất cả schedules
    const allSegsEmpty = resultWithSchedules.every((x) => x.segs.length === 0);
    if (allSegsEmpty) {
      resultWithSchedules[0].segs = schedules;
    }

    // ── Bước 4: Tìm refDate chung ─────────────────────────────────────────────
    let refDateStr = schedules[0].orderDate;
    for (const s of schedules) {
      if (s.orderDate < refDateStr) refDateStr = s.orderDate;
    }

    // ── Bước 5: Sort theo thời gian và build segment ──────────────────────────
    resultWithSchedules.sort((a, b) => {
      const aDate = a.segs[0]?.orderDate ?? "";
      const bDate = b.segs[0]?.orderDate ?? "";
      return aDate.localeCompare(bDate);
    });

    const builtSegments: BuiltSegment[] = [];
    for (let i = 0; i < resultWithSchedules.length; i++) {
      const { result: r, segs } = resultWithSchedules[i];
      const built = buildSegment(
        r,
        segs,
        refDateStr,
        SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      );
      if (built) builtSegments.push(built);
    }

    if (builtSegments.length === 0) return null;

    // Merge tất cả points — nếu cùng dayIndex, segment sau ghi đè
    const pointMap = new Map<number, ChartPoint>();
    for (const seg of builtSegments) {
      for (const pt of seg.points) pointMap.set(pt.dayIndex, pt);
    }
    const mergedData = Array.from(pointMap.values()).sort(
      (a, b) => a.dayIndex - b.dayIndex,
    );

    const allLeadTimeAreas = builtSegments.flatMap((s) => s.leadTimeAreas);
    const allStockoutAreas = builtSegments.flatMap((s) => s.stockoutAreas);

    const globalMax = Math.max(
      ...builtSegments.map((s) =>
        Math.max(s.result.maxInventoryLevel, s.result.reorderPointB),
      ),
    );

    const minDay = mergedData[0].dayIndex;
    const maxDay = mergedData[mergedData.length - 1].dayIndex;

    return {
      builtSegments,
      mergedData,
      allLeadTimeAreas,
      allStockoutAreas,
      maxY: globalMax * 1.2,
      minDay,
      maxDay,
      refDateStr,
    };
  }, [results, schedules]);

  if (!computed) {
    return (
      <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu</p>
    );
  }

  const {
    builtSegments,
    mergedData,
    allLeadTimeAreas,
    allStockoutAreas,
    maxY,
    minDay,
    maxDay,
    refDateStr,
  } = computed;

  const isMultiSegment = builtSegments.length > 1;
  const totalDays = maxDay - minDay;
  const tickStep = Math.max(1, Math.ceil(totalDays / 12));
  const ticks: number[] = [];
  for (let d = minDay; d <= maxDay; d += tickStep) ticks.push(d);

  return (
    <div className="space-y-3">
      {/* Legend — chỉ hiển thị khi có nhiều kế hoạch */}
      {isMultiSegment && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {builtSegments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="inline-block w-6 h-0.5 rounded"
                style={{ backgroundColor: seg.color }}
              />
              <span>
                Kế hoạch {i + 1} — B={seg.result.reorderPointB.toFixed(0)},
                S*(1-Q/K)={seg.result.maxInventoryLevel.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={440}>
        <ComposedChart
          data={mergedData}
          margin={{ top: 20, right: 90, bottom: 40, left: 20 }}
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
            tickFormatter={(val) => fmtDate(addDaysStr(refDateStr, val))}
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
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
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
                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs space-y-1">
                  <p className="font-medium text-foreground">
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
                  {p.segmentB != null && (
                    <p className="text-muted-foreground">
                      B (kỳ này):{" "}
                      <span className="font-mono text-foreground">
                        {p.segmentB.toLocaleString("vi-VN", {
                          maximumFractionDigits: 1,
                        })}
                      </span>
                    </p>
                  )}
                  {p.orderMarker !== undefined && (
                    <p className="text-destructive font-medium">
                      📦 Ngày đặt hàng {p.isWarning ? "⚠️ Tràn kỳ" : ""}
                    </p>
                  )}
                  {p.deliveryMarker !== undefined && (
                    <p className="text-emerald-600 font-medium">
                      🚚 Ngày nhận hàng
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Stockout areas */}
          {allStockoutAreas.map((area, i) => (
            <ReferenceArea
              key={`so-${i}`}
              x1={area.from}
              x2={area.to}
              fill="hsl(0 72% 51%)"
              fillOpacity={0.12}
              strokeOpacity={0}
            />
          ))}

          {/* Lead time areas */}
          {allLeadTimeAreas.map((area, i) => (
            <ReferenceArea
              key={`lt-${i}`}
              x1={area.from}
              x2={area.to}
              fill="hsl(215 70% 50%)"
              fillOpacity={0.06}
              strokeOpacity={0}
            />
          ))}

          {/* Đường ngăn cách giữa các segment */}
          {isMultiSegment &&
            builtSegments
              .slice(0, -1)
              .map((seg, i) => (
                <ReferenceArea
                  key={`sep-${i}`}
                  x1={seg.chartEnd}
                  x2={seg.chartEnd + 1}
                  fill="hsl(var(--border))"
                  fillOpacity={0.4}
                  strokeOpacity={0}
                />
              ))}

          {/*
           * B / Z / maxLevel — mỗi segment dùng ReferenceArea với y1=y2
           * để đường kẻ ngang chỉ kéo dài trong khoảng x của segment đó.
           */}
          {builtSegments.map((seg, i) => {
            const { result, chartStart, chartEnd } = seg;
            const B = result.reorderPointB;
            const Z = result.avgInventoryLevel;
            const ML = result.maxInventoryLevel;
            // Chỉ gắn label cho segment cuối cùng có giá trị đó
            // để tránh label bị đè lên nhau khi cùng giá trị
            const isLast = i === builtSegments.length - 1;
            const prevSeg = builtSegments[i - 1];
            const showBLabel =
              isLast || !prevSeg || prevSeg.result.reorderPointB !== B;
            const showZLabel =
              isLast || !prevSeg || prevSeg.result.avgInventoryLevel !== Z;
            const showMLLabel =
              isLast || !prevSeg || prevSeg.result.maxInventoryLevel !== ML;

            return (
              <g key={`refs-${i}`}>
                {/* maxLevel */}
                <ReferenceArea
                  x1={chartStart}
                  x2={chartEnd}
                  y1={ML}
                  y2={ML}
                  stroke="hsl(142 71% 35%)"
                  strokeWidth={1.5}
                  strokeDasharray="8 4"
                  fill="transparent"
                  label={
                    showMLLabel
                      ? {
                          value: `S*(1-Q/K)=${ML.toFixed(0)}`,
                          position: "right",
                          fill: "hsl(142 71% 35%)",
                          fontSize: 9,
                        }
                      : undefined
                  }
                />
                {/* Z */}
                <ReferenceArea
                  x1={chartStart}
                  x2={chartEnd}
                  y1={Z}
                  y2={Z}
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="transparent"
                  label={
                    showZLabel
                      ? {
                          value: `Z=${Z.toFixed(0)}`,
                          position: "right",
                          fill: "hsl(38 92% 50%)",
                          fontSize: 9,
                        }
                      : undefined
                  }
                />
                {/* B */}
                <ReferenceArea
                  x1={chartStart}
                  x2={chartEnd}
                  y1={B}
                  y2={B}
                  stroke="hsl(0 72% 51%)"
                  strokeWidth={1.5}
                  strokeDasharray="8 4"
                  fill="transparent"
                  label={
                    showBLabel
                      ? {
                          value: `B=${B.toFixed(0)}`,
                          position: "right",
                          fill: "hsl(0 72% 51%)",
                          fontSize: 9,
                        }
                      : undefined
                  }
                />
              </g>
            );
          })}

          {/* Đường tồn kho — 1 Line per segment, màu riêng */}
          {builtSegments.map((seg, i) => (
            <Line
              key={`line-${i}`}
              data={seg.points}
              dataKey="inventory"
              type="linear"
              stroke={seg.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: seg.color }}
              connectNulls={false}
            />
          ))}

          <Scatter dataKey="orderMarker" shape={<OrderMarkerShape />} />
          <Scatter dataKey="deliveryMarker" shape={<DeliveryMarkerShape />} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Bảng thông số từng kế hoạch — chỉ hiện khi multi-segment */}
      {isMultiSegment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {builtSegments.map((seg, i) => (
            <div
              key={i}
              className="rounded-md px-3 py-2 text-xs space-y-1 bg-muted"
              style={{ borderLeft: `3px solid ${seg.color}` }}
            >
              <p className="font-semibold text-foreground">Kế hoạch {i + 1}</p>
              <p className="font-mono text-muted-foreground">
                S*(1-Q/K) ={" "}
                <span className="text-foreground">
                  {seg.result.maxInventoryLevel.toFixed(1)}
                </span>
              </p>
              <p className="font-mono text-muted-foreground">
                Z ={" "}
                <span className="text-foreground">
                  {seg.result.avgInventoryLevel.toFixed(1)}
                </span>
              </p>
              <p className="font-mono text-muted-foreground">
                B ={" "}
                <span className="text-foreground">
                  {seg.result.reorderPointB.toFixed(1)}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
