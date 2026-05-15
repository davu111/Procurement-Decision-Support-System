import { UrgencyLevel } from "@/types";
import type { OrderSchedule } from "@/types/inventory-opt/order-schedule";

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} tr`;
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// export function getUrgencyInfo(orders: OrderSchedule[]): UrgencyInfo {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const nextOrder = orders
//     .filter((o) => !o.actualOrderDate)
//     .sort(
//       (a, b) =>
//         new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
//     )[0];

//   if (!nextOrder) return { level: "green", daysLeft: null, nextOrder: null };

//   const orderDate = new Date(nextOrder.orderDate);
//   const daysLeft = Math.floor(
//     (orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
//   );

//   let level: UrgencyLevel = "green";
//   if (daysLeft <= 0 || nextOrder.isReorderWarning) level = "red";
//   else if (daysLeft <= 7) level = "yellow";

//   return { level, daysLeft, nextOrder };
// }

export function groupOrdersByDate(
  orders: OrderSchedule[],
): Record<string, OrderSchedule[]> {
  return orders.reduce(
    (map, order) => {
      const key = order.orderDate;
      if (!map[key]) map[key] = [];
      map[key].push(order);
      return map;
    },
    {} as Record<string, OrderSchedule[]>,
  );
}

export function getHeatmapIntensity(
  orders: OrderSchedule[] | undefined,
): number | "overdue" {
  if (!orders || orders.length === 0) return 0;
  // const hasOverdue = orders.some(
  //   (o) => !o.actualOrderDate && new Date(o.orderDate) < new Date(),
  // );
  // if (hasOverdue) return "overdue";
  return Math.min(orders.length, 3);
}
