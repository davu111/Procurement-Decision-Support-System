import api, { ApiResponse } from "./axiosConfig";
import {
  LossRateAnalysis,
  ServiceLevelAnalysis,
} from "../types/inventory-opt/Analytics";

export const analyticsApi = {
  /**
   * Phân tích tỷ lệ thất thoát từ phiếu kiểm kê
   */
  getLossRateAnalysis: (productId: string, from: string, to: string) =>
    api
      .get<ApiResponse<LossRateAnalysis>>(`/analytics/loss-rate/${productId}`, {
        params: { from, to },
      })
      .then((r) => (r as any).data),

  /**
   * Phân tích Service Level từ lịch đặt hàng
   */
  getServiceLevelAnalysis: (productId: string, from: string, to: string) =>
    api
      .get<ApiResponse<ServiceLevelAnalysis>>(
        `/analytics/service-level/${productId}`,
        {
          params: { from, to },
        },
      )
      .then((r) => (r as any).data),

  /**
   * Xác nhận ngày giao hàng thực tế
   */
  confirmDelivery: (orderId: number, actualDeliveryDate: string) =>
    api
      .patch<ApiResponse<string>>(
        `/order-schedules/${orderId}/confirm-delivery`,
        {
          actualDeliveryDate,
        },
      )
      .then((r) => (r as any).data),
};
