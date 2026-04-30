import { useMemo, useState, useEffect } from "react";
import KpiCard from "@/components/common/KpiCard";
import OrderAlertTable from "@/components/common/OrderAlertTable";
// import { mockProducts, mockOrderSchedules } from '@/data/mockData';
import type { Product } from "@/types/inventory-opt/product";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import api from "@/api/axiosConfig";
import { getUrgencyInfo } from "@/utils/helpers";
import { AlertTriangle, Clock, CheckCircle, Package } from "lucide-react";
import HeatmapPage from "./HeatmapPage";

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

  useEffect(() => {
    api
      .get("/products")
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));

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

  const stats = useMemo(() => {
    let red = 0,
      yellow = 0,
      green = 0;
    products.forEach((p) => {
      const orders = orderSchedules.filter((o) => o.productId === p.id);
      const u = getUrgencyInfo(orders);
      if (u.level === "red") red++;
      else if (u.level === "yellow") yellow++;
      else green++;
    });
    return { red, yellow, green, total: products.length };
  }, [products, orderSchedules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bảng điều khiển</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan tình trạng đặt hàng hôm nay
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Cần xử lý ngay"
          value={stats.red}
          icon={AlertTriangle}
          variant="danger"
        />
        <KpiCard
          title="Sắp đến hạn"
          value={stats.yellow}
          icon={Clock}
          variant="warning"
        />
        <KpiCard
          title="Ổn định"
          value={stats.green}
          icon={CheckCircle}
          variant="success"
        />
        <KpiCard
          title="Tổng mặt hàng"
          value={stats.total}
          icon={Package}
          variant="info"
        />
      </div>

      <OrderAlertTable
        orders={orderSchedules}
        products={products.map((p) => ({
          id: p.id,
          name: p.productName,
          unit: p.unit,
        }))}
      />

      <HeatmapPage />
    </div>
  );
}
