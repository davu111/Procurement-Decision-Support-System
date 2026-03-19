import { OrderSchedule, UrgencyInfo } from '@/types';
import { formatCurrency, formatNumber, formatDate, getUrgencyInfo } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface OrderAlertTableProps {
  orders: OrderSchedule[];
  products: { id: number; name: string; unit: string }[];
}

export default function OrderAlertTable({ orders, products }: OrderAlertTableProps) {
  const navigate = useNavigate();

  // Group by product, compute urgency
  const productAlerts = products.map(product => {
    const productOrders = orders.filter(o => o.productId === product.id);
    const urgency = getUrgencyInfo(productOrders);
    return { product, urgency, orders: productOrders };
  }).filter(a => a.urgency.nextOrder).sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return order[a.urgency.level] - order[b.urgency.level];
  });

  const levelConfig = {
    red: { badge: 'Đặt NGAY', badgeClass: 'bg-status-danger text-destructive-foreground', rowClass: 'border-l-4 border-l-status-danger' },
    yellow: { badge: 'Sắp đến hạn', badgeClass: 'bg-status-warning text-foreground', rowClass: 'border-l-4 border-l-status-warning' },
    green: { badge: 'Ổn định', badgeClass: 'bg-status-success text-destructive-foreground', rowClass: 'border-l-4 border-l-status-success' },
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-semibold text-foreground">Cảnh báo đặt hàng</h2>
      </div>
      <div className="divide-y">
        {productAlerts.map(({ product, urgency }) => {
          const config = levelConfig[urgency.level];
          const nextOrder = urgency.nextOrder!;
          return (
            <div
              key={product.id}
              className={cn("flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 cursor-pointer transition-colors", config.rowClass)}
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Đặt hàng lần {nextOrder.orderSequence} · {formatDate(nextOrder.orderDate)}
                </p>
              </div>
              <Badge className={cn("shrink-0", config.badgeClass)}>
                {urgency.level === 'red'
                  ? config.badge
                  : urgency.daysLeft !== null
                    ? `${urgency.daysLeft} ngày`
                    : config.badge
                }
              </Badge>
              <div className="text-right shrink-0 w-28">
                <p className="font-mono text-sm font-medium">{formatNumber(nextOrder.orderQuantity)} {product.unit}</p>
              </div>
              <div className="text-right shrink-0 w-24">
                <p className="font-mono text-sm font-medium text-muted-foreground">{formatCurrency(nextOrder.estimatedCost)}</p>
              </div>
            </div>
          );
        })}
        {productAlerts.length === 0 && (
          <div className="px-5 py-8 text-center text-muted-foreground">Không có đơn hàng nào</div>
        )}
      </div>
    </div>
  );
}
