import { useMemo } from 'react';
import KpiCard from '@/components/common/KpiCard';
import OrderAlertTable from '@/components/common/OrderAlertTable';
import { mockProducts, mockOrderSchedules } from '@/data/mockData';
import { getUrgencyInfo } from '@/utils/helpers';
import { AlertTriangle, Clock, CheckCircle, Package } from 'lucide-react';

export default function Dashboard() {
  const stats = useMemo(() => {
    let red = 0, yellow = 0, green = 0;
    mockProducts.forEach(p => {
      const orders = mockOrderSchedules.filter(o => o.productId === p.id);
      const u = getUrgencyInfo(orders);
      if (u.level === 'red') red++;
      else if (u.level === 'yellow') yellow++;
      else green++;
    });
    return { red, yellow, green, total: mockProducts.length };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bảng điều khiển</h1>
        <p className="text-muted-foreground mt-1">Tổng quan tình trạng đặt hàng hôm nay</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Cần xử lý ngay" value={stats.red} icon={AlertTriangle} variant="danger" />
        <KpiCard title="Sắp đến hạn" value={stats.yellow} icon={Clock} variant="warning" />
        <KpiCard title="Ổn định" value={stats.green} icon={CheckCircle} variant="success" />
        <KpiCard title="Tổng mặt hàng" value={stats.total} icon={Package} variant="info" />
      </div>

      <OrderAlertTable
        orders={mockOrderSchedules}
        products={mockProducts.map(p => ({ id: p.id, name: p.name, unit: p.unit }))}
      />
    </div>
  );
}
