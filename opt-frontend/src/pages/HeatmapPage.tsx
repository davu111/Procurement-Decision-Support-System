import { useMemo, useState } from 'react';
import { mockOrderSchedules } from '@/data/mockData';
import { groupOrdersByDate, getHeatmapIntensity, formatCurrency, formatNumber } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
  0: 'bg-heatmap-empty',
  1: 'bg-heatmap-1',
  2: 'bg-heatmap-2',
  3: 'bg-heatmap-3',
  overdue: 'bg-heatmap-overdue animate-pulse-gentle',
};

export default function HeatmapPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const grouped = useMemo(() => groupOrdersByDate(mockOrderSchedules), []);
  const days = useMemo(() => getDaysInYear(year), [year]);

  // Group by week
  const weeks: Date[][] = useMemo(() => {
    const w: Date[][] = [];
    let currentWeek: Date[] = [];
    const firstDay = days[0].getDay();
    // Pad first week
    for (let i = 0; i < firstDay; i++) currentWeek.push(null as any);
    days.forEach(d => {
      currentWeek.push(d);
      if (d.getDay() === 6) {
        w.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) w.push(currentWeek);
    return w;
  }, [days]);

  const hoveredOrders = hoveredDate ? grouped[hoveredDate] : null;
  const selectedOrders = selectedDate ? grouped[selectedDate] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch đặt hàng</h1>
          <p className="text-muted-foreground mt-1">Tổng quan đơn hàng theo năm</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg w-16 text-center">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 overflow-x-auto">
        {/* Month labels */}
        <div className="flex gap-0.5 mb-2 ml-8">
          {MONTHS.map((m, i) => (
            <div key={m} className="text-xs text-muted-foreground" style={{ width: `${100/12}%` }}>{m}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {DAYS.map(d => (
              <div key={d} className="h-3 text-[10px] text-muted-foreground flex items-center">{d}</div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-0.5 flex-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="h-3 w-3" />;
                  const dateStr = day.toISOString().split('T')[0];
                  const orders = grouped[dateStr];
                  const intensity = getHeatmapIntensity(orders);
                  return (
                    <div
                      key={di}
                      className={cn(
                        "h-3 w-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-ring",
                        intensityClasses[intensity],
                        selectedDate === dateStr && "ring-2 ring-primary"
                      )}
                      onMouseEnter={() => setHoveredDate(dateStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
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
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", intensityClasses[i])} />
          ))}
          <span>Nhiều</span>
          <div className="ml-4 flex items-center gap-1">
            <div className={cn("h-3 w-3 rounded-sm", intensityClasses['overdue'])} />
            <span>Quá hạn</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredOrders && hoveredDate && (
        <div className="bg-card rounded-lg border p-4 shadow-md">
          <p className="font-medium text-sm text-foreground mb-2">
            {new Date(hoveredDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          {hoveredOrders.map(o => (
            <div key={o.id} className="flex justify-between text-sm text-muted-foreground">
              <span>• {o.productName}</span>
              <span className="font-mono">{formatNumber(o.orderQuantity)}</span>
            </div>
          ))}
          <p className="text-sm font-medium mt-2 pt-2 border-t text-foreground">
            Tổng chi phí: {formatCurrency(hoveredOrders.reduce((s, o) => s + o.estimatedCost, 0))}
          </p>
        </div>
      )}

      {/* Selected date detail */}
      {selectedOrders && selectedDate && (
        <div className="bg-card rounded-lg border p-5">
          <h3 className="font-semibold text-foreground mb-3">
            Chi tiết ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
          </h3>
          <div className="space-y-3">
            {selectedOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="font-medium text-foreground">{o.productName}</p>
                  <p className="text-sm text-muted-foreground">Lần đặt #{o.orderSequence} · Giao dự kiến: {new Date(o.expectedDeliveryDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium">{formatNumber(o.orderQuantity)}</p>
                  <p className="text-sm text-muted-foreground font-mono">{formatCurrency(o.estimatedCost)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
