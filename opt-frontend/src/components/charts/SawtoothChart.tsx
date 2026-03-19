import { useMemo } from 'react';
import { InventoryResult, OrderSchedule } from '@/types';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Scatter } from 'recharts';

interface SawtoothChartProps {
  result: InventoryResult;
  schedules: OrderSchedule[];
}

export default function SawtoothChart({ result, schedules }: SawtoothChartProps) {
  const data = useMemo(() => {
    if (schedules.length === 0) return [];

    const sortedSchedules = [...schedules].sort((a, b) =>
      new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime()
    );

    const startDate = new Date(sortedSchedules[0].orderDate);
    const lastDelivery = new Date(sortedSchedules[sortedSchedules.length - 1].expectedDeliveryDate);
    const endDate = new Date(lastDelivery);
    endDate.setDate(endDate.getDate() + 30);

    const maxLevel = result.maxInventoryLevel;
    const dailyConsumption = result.demandQ / 365;

    const points: { date: string; inventory: number; reorderPoint: number; avgLevel: number; delivery?: number }[] = [];
    let currentInventory = 0;
    const d = new Date(startDate);

    const deliveryDates = new Set(sortedSchedules.map(s => s.expectedDeliveryDate));
    const orderDates = new Set(sortedSchedules.map(s => s.orderDate));

    while (d <= endDate) {
      const dateStr = d.toISOString().split('T')[0];

      if (deliveryDates.has(dateStr)) {
        currentInventory = maxLevel;
      }

      points.push({
        date: dateStr,
        inventory: Math.max(0, currentInventory),
        reorderPoint: result.reorderPointB,
        avgLevel: result.avgInventoryLevel,
        delivery: deliveryDates.has(dateStr) ? maxLevel : undefined,
      });

      currentInventory -= dailyConsumption;
      d.setDate(d.getDate() + 1);
    }
    return points;
  }, [result, schedules]);

  if (data.length === 0) return <p className="text-muted-foreground text-center py-10">Chưa có dữ liệu</p>;

  // Show every ~30th label
  const tickInterval = Math.max(1, Math.floor(data.length / 10));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
          interval={tickInterval}
        />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          labelFormatter={(v) => new Date(v as string).toLocaleDateString('vi-VN')}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              inventory: 'Tồn kho',
              reorderPoint: 'Điểm đặt hàng (B)',
              avgLevel: 'Tồn kho TB (Z)',
            };
            return [value.toFixed(2), labels[name] || name];
          }}
        />
        <ReferenceLine y={result.reorderPointB} stroke="hsl(0 72% 51%)" strokeDasharray="8 4" label={{ value: 'B', position: 'right', fill: 'hsl(0 72% 51%)', fontSize: 12 }} />
        <ReferenceLine y={result.avgInventoryLevel} stroke="hsl(38 92% 50%)" strokeDasharray="4 4" label={{ value: 'Z', position: 'right', fill: 'hsl(38 92% 50%)', fontSize: 12 }} />
        <Line type="linear" dataKey="inventory" stroke="hsl(215 70% 50%)" strokeWidth={2} dot={false} />
        <Scatter dataKey="delivery" fill="hsl(142 71% 35%)" shape="triangle" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
