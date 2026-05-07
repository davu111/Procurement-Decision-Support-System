import { useMemo, useState, useEffect, useRef } from "react";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import api from "@/api/axiosConfig";
import {
  groupOrdersByDate,
  getHeatmapIntensity,
  formatCurrency,
  formatNumber,
} from "@/utils/helpers";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  PackageCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const MONTHS = [
  "Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6",
  "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12",
];
const DAYS_LABEL = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const GAP = 3;          // px — khoảng cách giữa các ô
const MIN_CELL = 14;    // px — kích thước ô tối thiểu
const MAX_CELL = 22;    // px — kích thước ô tối đa
const DAY_LABEL_W = 24; // px — chiều rộng cột nhãn ngày

function getDaysInYear(year: number) {
  const days: Date[] = [];
  const end = new Date(year, 11, 31);
  const d = new Date(year, 0, 1);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Màu chủ đạo indigo — khớp với primary (#6366F1) của design guide
function getCellStyle(intensity: string | number): React.CSSProperties {
  if (intensity === "overdue") return { backgroundColor: "#EF4444" };
  if (intensity === 3) return { backgroundColor: "#4338CA" };  // indigo-700
  if (intensity === 2) return { backgroundColor: "#818CF8" };  // indigo-400
  if (intensity === 1) return { backgroundColor: "#C7D2FE" };  // indigo-200
  return { backgroundColor: "#EEF2FF" };                       // indigo-50 (empty)
}

export default function HeatmapPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  // Container ref để đo chiều rộng thực tế → tính cellSize động
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const grouped = useMemo(
    () => groupOrdersByDate(orderSchedules),
    [orderSchedules],
  );
  const days = useMemo(() => getDaysInYear(year), [year]);

  // Group by week — tuần bắt đầu T2
  const weeks: (Date | null)[][] = useMemo(() => {
    const w: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    const firstDay = days[0].getDay();
    const padCount = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < padCount; i++) currentWeek.push(null);
    days.forEach((d) => {
      currentWeek.push(d);
      if (d.getDay() === 0) {
        w.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) w.push(currentWeek);
    return w;
  }, [days]);

  // Tính cellSize động: chia đều chiều rộng container cho số tuần
  const cellSize = useMemo(() => {
    if (!containerWidth || weeks.length === 0) return MIN_CELL;
    // Available width = containerWidth - padding(48) - dayLabels - gaps giữa tuần
    const available = containerWidth - 48 - DAY_LABEL_W - GAP * (weeks.length - 1);
    const computed = Math.floor(available / weeks.length);
    return Math.max(MIN_CELL, Math.min(MAX_CELL, computed));
  }, [containerWidth, weeks.length]);

  const cellTotal = cellSize + GAP;

  // Month label offsets
  const monthColOffsets = useMemo(() => {
    const offsets: { month: number; colStart: number; colSpan: number }[] = [];
    weeks.forEach((week) => {
      const firstReal = week.find((d) => d != null) as Date | undefined;
      if (!firstReal) return;
      const m = firstReal.getMonth();
      const last = offsets[offsets.length - 1];
      if (!last || last.month !== m) {
        offsets.push({ month: m, colStart: offsets.length, colSpan: 1 });
      } else {
        last.colSpan++;
      }
    });
    return offsets;
  }, [weeks]);

  const hoveredOrders = hoveredDate ? grouped[hoveredDate] : null;
  const selectedOrders = selectedDate ? grouped[selectedDate] : null;

  const yearStats = useMemo(() => {
    const yearSchedules = orderSchedules.filter((o) =>
      o.orderDate?.startsWith(String(year)),
    );
    const total = yearSchedules.length;
    const dates = new Set(yearSchedules.map((o) => o.orderDate?.slice(0, 10))).size;
    return { total, dates };
  }, [orderSchedules, year]);

  useEffect(() => {
    api
      .get("/order-schedules", {
        params: { from: "2025-01-01", to: "2026-12-31" },
      })
      .then((response) => setOrderSchedules(response.data))
      .catch((error) =>
        console.error("Error fetching order schedules:", error),
      );
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display text-gray-900">
              Lịch đặt hàng
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {yearStats.total} lần đặt · {yearStats.dates} ngày có đơn
            </p>
          </div>
        </div>

        {/* Year picker */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-sm">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          <span className="font-semibold text-sm text-gray-900 w-12 text-center">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Heatmap Card ──────────────────────────────────────────────────── */}
      <Card className="p-0" ref={containerRef}>
        <div className="p-6">
          {/* Month labels */}
          <div
            className="flex mb-2"
            style={{ gap: GAP, marginLeft: DAY_LABEL_W + GAP }}
          >
            {monthColOffsets.map(({ month, colSpan }) => (
              <div
                key={month}
                className="text-[10px] font-medium text-gray-400 overflow-hidden"
                style={{
                  width: colSpan * cellTotal - GAP,
                  flexShrink: 0,
                }}
              >
                {MONTHS[month]}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex" style={{ gap: GAP }}>
            {/* Day labels */}
            <div
              className="flex flex-col shrink-0"
              style={{ gap: GAP, width: DAY_LABEL_W }}
            >
              {DAYS_LABEL.map((d) => (
                <div
                  key={d}
                  className="flex items-center text-[10px] font-medium text-gray-400"
                  style={{ height: cellSize }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex flex-1" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  className="flex flex-col"
                  style={{ gap: GAP }}
                >
                  {week.map((day, di) => {
                    if (!day)
                      return (
                        <div
                          key={di}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    const dateStr = day.toISOString().split("T")[0];
                    const orders = grouped[dateStr];
                    const intensity = getHeatmapIntensity(orders);
                    const isSelected = selectedDate === dateStr;
                    const isHovered = hoveredDate === dateStr;

                    return (
                      <div
                        key={di}
                        className={cn(
                          "rounded-sm cursor-pointer transition-all duration-100",
                          isSelected && "ring-2 ring-offset-1 ring-primary scale-110 z-10",
                          isHovered && !isSelected && "scale-110 z-10 brightness-90",
                        )}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          ...getCellStyle(intensity),
                          boxShadow:
                            isHovered || isSelected
                              ? "0 2px 8px rgba(99,102,241,0.25)"
                              : undefined,
                        }}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        onClick={() =>
                          setSelectedDate(
                            selectedDate === dateStr ? null : dateStr,
                          )
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              Ít
            </span>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{ width: 12, height: 12, ...getCellStyle(i) }}
              />
            ))}
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              Nhiều
            </span>
            <div className="ml-3 flex items-center gap-1.5">
              <div
                className="rounded-sm"
                style={{ width: 12, height: 12, ...getCellStyle("overdue") }}
              />
              <span className="text-[10px] font-medium text-red-500">Quá hạn</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Hover tooltip ────────────────────────────────────────────────── */}
      {hoveredOrders && hoveredDate && !selectedDate && (
        <Card className="p-4 shadow-level-2 border-primary/20">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {new Date(hoveredDate + "T00:00:00").toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="space-y-2">
            {hoveredOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-start gap-3 text-sm pb-2 border-b border-gray-50 last:border-b-0 last:pb-0"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <PackageCheck className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 leading-tight">
                    {o.productName}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Lần #{o.orderSequence} · Giao{" "}
                    {new Date(o.expectedDeliveryDate + "T00:00:00").toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Selected date detail panel ────────────────────────────────────── */}
      {selectedOrders && selectedDate && (
        <Card className="p-0 overflow-hidden border-primary/20">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/5 to-indigo-50 border-b border-primary/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "vi-VN",
                    {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
                <p className="text-[11px] text-gray-400">
                  {selectedOrders.length} đơn đặt hàng
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="w-7 h-7 rounded-lg hover:bg-white/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Orders list */}
          <div className="divide-y divide-gray-50">
            {selectedOrders.map((o, idx) => (
              <div
                key={o.id}
                className="px-5 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {o.productName}
                      </p>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{o.orderSequence}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                          Mã SP
                        </p>
                        <p className="text-xs font-mono text-gray-700">
                          {o.productId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                          Mã kết quả
                        </p>
                        <p className="text-xs font-mono text-gray-700">
                          {o.inventoryResultId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                          Ngày đặt
                        </p>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(o.orderDate + "T00:00:00").toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                          Dự kiến giao
                        </p>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(o.expectedDeliveryDate + "T00:00:00").toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
