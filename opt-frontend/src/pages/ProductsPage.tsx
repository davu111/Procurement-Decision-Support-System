// import { mockProducts, mockOrderSchedules } from '@/data/mockData';
import type { Product } from '@/types/inventory-opt/product';
import type { OrderSchedule } from '@/types/inventory-opt/order-schedule';
import api from '@/api/axiosConfig';
import { formatDate, getUrgencyInfo, formatNumber } from '@/utils/helpers';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  useEffect(() => {
    api.get('/inventory-products')
      .then(response => setProducts(response.data))
      .catch(error => console.error('Error fetching products:', error));

    api.get('/order-schedules', {
      params: {
    from: '2025-01-01',
    to: '2026-12-31'
  }
    })
      .then(response => setOrderSchedules(response.data))
      .catch(error => console.error('Error fetching order schedules:', error));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Danh sách mặt hàng</h1>
        <p className="text-muted-foreground mt-1">Quản lý và theo dõi tình trạng từng mặt hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => {
          const orders = orderSchedules.filter(o => o.productId === product.id);
          const urgency = getUrgencyInfo(orders);
          const pendingOrders = orders.filter(o => !o.actualOrderDate).length;

          return (
            <div
              key={product.id}
              className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{product.code}</p>
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                </div>
                <Badge className={cn(
                  urgency.level === 'red' && 'bg-status-danger text-destructive-foreground',
                  urgency.level === 'yellow' && 'bg-status-warning text-foreground',
                  urgency.level === 'green' && 'bg-status-success text-destructive-foreground',
                )}>
                  {urgency.level === 'red' ? 'Khẩn' : urgency.level === 'yellow' ? 'Sắp hạn' : 'Ổn'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đơn vị: {product.unit}</span>
                <span className="text-muted-foreground">{pendingOrders} đơn chờ</span>
              </div>
              {urgency.nextOrder && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Đặt tiếp theo: </span>
                  <span className="font-medium text-foreground">{formatDate(urgency.nextOrder.orderDate)}</span>
                  <span className="text-muted-foreground ml-2">· {formatNumber(urgency.nextOrder.orderQuantity)} {product.unit}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
