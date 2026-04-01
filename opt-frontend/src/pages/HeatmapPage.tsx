import { useMemo, useState, useEffect } from "react";
// import { mockOrderSchedules } from '@/data/mockData';
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import api from "@/api/axiosConfig";
import {
  groupOrdersByDate,
  getHeatmapIntensity,
  formatCurrency,
  formatNumber,
} from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const CELL_SIZE = 18.5; // px (h-3 w-3 ~ 12px)
const GAP = 3; // gap-0.5 ~ 2px
const CELL_TOTAL = CELL_SIZE + GAP;

function getDaysInYear(year: number) {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const intensityClasses: Record<string | number, string> = {
  0: "bg-heatmap-empty",
  1: "bg-heatmap-1",
  2: "bg-heatmap-2",
  3: "bg-heatmap-3",
  overdue: "bg-heatmap-overdue animate-pulse-gentle",
};

export default function HeatmapPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  const grouped = useMemo(
    () => groupOrdersByDate(orderSchedules),
    [orderSchedules],
  );
  const days = useMemo(() => getDaysInYear(year), [year]);

  // Group by week — tuần bắt đầu Thứ 2 (getDay()===1), kết thúc Chủ Nhật (getDay()===0)
  const weeks: Date[][] = useMemo(() => {
    const w: Date[][] = [];
    let currentWeek: Date[] = [];
    const firstDay = days[0].getDay(); // 0=CN, 1=T2,...,6=T7
    // Tuần bắt đầu T2: CN=0 → pad 6, T2=1 → pad 0, T3=2 → pad 1, ...
    const padCount = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < padCount; i++) currentWeek.push(null as any);
    days.forEach((d) => {
      currentWeek.push(d);
      if (d.getDay() === 0) {
        // CN = cuối tuần
        w.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) w.push(currentWeek);
    return w;
  }, [days]);

  // Tính vị trí month labels dựa trên cột tuần thực tế
  const monthColOffsets = useMemo(() => {
    const offsets: { month: number; colStart: number; colSpan: number }[] = [];
    weeks.forEach((week, wi) => {
      const firstReal = week.find((d) => d != null);
      if (!firstReal) return;
      const m = firstReal.getMonth();
      const last = offsets[offsets.length - 1];
      if (!last || last.month !== m) {
        offsets.push({ month: m, colStart: wi, colSpan: 1 });
      } else {
        last.colSpan++;
      }
    });
    return offsets;
  }, [weeks]);

  const hoveredOrders = hoveredDate ? grouped[hoveredDate] : null;
  const selectedOrders = selectedDate ? grouped[selectedDate] : null;

  useEffect(() => {
    api
      .get("/order-schedules", {
        params: {
          from: "2025-01-01",
          to: "2026-12-31",
        },
      })
      .then((response) => setOrderSchedules(response.data))
      .catch((error) =>
        console.error("Error fetching order schedules:", error),
      );
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch đặt hàng</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg w-16 text-center">{year}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 overflow-x-auto w-max">
        {/* Month labels */}
        {/* Month labels — căn theo cột tuần thực tế */}
        <div
          className="flex mb-2 relative"
          style={{ minHeight: 16, gap: GAP, marginLeft: CELL_TOTAL * 2 }}
        >
          <div className="flex" style={{ gap: GAP }}>
            {monthColOffsets.map(({ month, colStart, colSpan }) => (
              <div
                key={month}
                className="text-xs text-muted-foreground overflow-hidden"
                style={{
                  // mỗi cột = h-3 w-3 + gap-0.5 = 12 + 2 = 14px
                  width: colSpan * CELL_TOTAL - GAP,
                  flexShrink: 0,
                }}
              >
                {MONTHS[month]}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: GAP }}>
            {DAYS.map((d) => (
              <div
                key={d}
                className="flex items-center"
                style={{
                  height: CELL_SIZE,
                  fontSize: 10,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="h-3 w-3" />;
                  const dateStr = day.toISOString().split("T")[0];
                  const orders = grouped[dateStr];
                  const intensity = getHeatmapIntensity(orders);
                  return (
                    <div
                      key={di}
                      className={cn(
                        "rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-ring",
                        intensityClasses[intensity],
                        selectedDate === dateStr && "ring-2 ring-primary",
                      )}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
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
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>Ít</span>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("h-3 w-3 rounded-sm", intensityClasses[i])}
            />
          ))}
          <span>Nhiều</span>
          <div className="ml-4 flex items-center gap-1">
            <div
              className={cn("h-3 w-3 rounded-sm", intensityClasses["overdue"])}
            />
            <span>Quá hạn</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredOrders && hoveredDate && (
        <div className="bg-card rounded-lg border p-4 shadow-md">
          <p className="font-medium text-sm text-foreground mb-2">
            {new Date(hoveredDate).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
          {hoveredOrders.map((o) => (
            <div
              key={o.id}
              className="flex justify-between text-sm text-muted-foreground"
            >
              <span>• {o.productName}</span>
              <span className="font-mono">{formatNumber(o.orderQuantity)}</span>
            </div>
          ))}
          <p className="text-sm font-medium mt-2 pt-2 border-t text-foreground">
            Tổng chi phí:{" "}
            {formatCurrency(
              hoveredOrders.reduce((s, o) => s + o.estimatedCost, 0),
            )}
          </p>
        </div>
      )}

      {/* Selected date detail */}
      {selectedOrders && selectedDate && (
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold text-foreground mb-3">
            Chi tiết ngày {new Date(selectedDate).toLocaleDateString("vi-VN")}
          </h3>
          <div className="space-y-3">
            {selectedOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div>
                  <p className="font-medium text-foreground">{o.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Lần đặt #{o.orderSequence} · Giao dự kiến:{" "}
                    {new Date(o.expectedDeliveryDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium">
                    {formatNumber(o.orderQuantity)}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {formatCurrency(o.estimatedCost)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
