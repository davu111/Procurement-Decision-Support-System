import { useMemo, useState, useEffect } from "react";
import KpiCard from "@/components/common/KpiCard";
import OrderAlertTable from "@/components/common/OrderAlertTable";
import type { Product } from "@/types/inventory-opt/product";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";
import api from "@/api/axiosConfig";
import { getUrgencyInfo } from "@/utils/helpers";
import { AlertTriangle, Clock, CheckCircle, Package } from "lucide-react";
import HeatmapPage from "./HeatmapPage";
import ForecastPage from "./ForecastPage";

export default function Dashboard() {
  const [orderSchedules, setOrderSchedules] = useState<OrderSchedule[]>([]);

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
      <div>
        <h1 className="text-3xl font-bold font-display text-gray-900">Bảng điều khiển</h1>
        <p className="text-sm text-gray-400 mt-1">
          Tổng quan tình trạng đặt hàng hôm nay
        </p>
      </div>

      <ForecastPage />
      <HeatmapPage />
    </div>
  );
}
