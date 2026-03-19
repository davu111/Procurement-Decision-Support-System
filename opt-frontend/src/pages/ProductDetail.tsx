import { useParams, useNavigate } from 'react-router-dom';
import { mockProducts, mockOrderSchedules, mockInventoryResult, mockConsumptionHistory } from '@/data/mockData';
import { formatCurrency, formatNumber, formatDate } from '@/utils/helpers';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SawtoothChart from '@/components/charts/SawtoothChart';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);
  const product = mockProducts.find(p => p.id === productId);
  const orders = mockOrderSchedules.filter(o => o.productId === productId);

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy mặt hàng</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Quay lại</Button>
      </div>
    );
  }

  const result = mockInventoryResult; // In production, fetch per product

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-muted-foreground">{product.code} · {product.unit}</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'S* (Lượng đặt tối ưu)', value: `${formatNumber(result.optimalOrderQtyS)} ${product.unit}` },
          { label: 'n* (Số lần đặt)', value: formatNumber(result.optimalOrderCountN) },
          { label: 'τ* (Chu kỳ)', value: `${formatNumber(result.optimalCycleTimeTau, 4)} kỳ` },
          { label: 'B (Điểm đặt hàng)', value: `${formatNumber(result.reorderPointB)} ${product.unit}` },
          { label: 'D_min (Chi phí tối thiểu)', value: formatCurrency(result.minTotalCost) },
        ].map(m => (
          <div key={m.label} className="bg-card border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
            <p className="text-lg font-bold font-mono text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Sawtooth Chart */}
      <div className="bg-card border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Biểu đồ tồn kho (Răng cưa)</h2>
        </div>
        <SawtoothChart result={result} schedules={orders} />
      </div>

      {/* Order schedule table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Lịch đặt hàng</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lần</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày đặt</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ngày giao</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Số lượng</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Chi phí</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono">#{o.orderSequence}</td>
                  <td className="px-4 py-3">{formatDate(o.orderDate)}</td>
                  <td className="px-4 py-3">{formatDate(o.expectedDeliveryDate)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(o.orderQuantity)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(o.estimatedCost)}</td>
                  <td className="px-4 py-3 text-center">
                    {o.actualOrderDate ? (
                      <Badge className="bg-status-success text-destructive-foreground">Đã đặt</Badge>
                    ) : o.isReorderWarning ? (
                      <Badge className="bg-status-danger text-destructive-foreground">Cần đặt ngay</Badge>
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
    </div>
  );
}
