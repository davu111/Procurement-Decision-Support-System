import api, { ApiResponse } from "./axiosConfig";
import {
  StockCount,
  CreateStockCountRequest,
  ConfirmStockCountRequest,
} from "../types/inventory-opt/StockCount";

export const stocktakingApi = {
  /**
   * Tạo phiếu kiểm kê DRAFT — systemQuantity được tính tự động
   */
  createDraft: (data: CreateStockCountRequest) =>
    api
      .post<ApiResponse<StockCount>>("/stock-counts", data)
      .then((r) => (r as any).data),

  /**
   * Xác nhận phiếu kiểm kê — nhập actualQuantity, chốt variance
   */
  confirm: (stockCountId: number, data: ConfirmStockCountRequest) =>
    api
      .put<
        ApiResponse<StockCount>
      >(`/stock-counts/${stockCountId}/confirm`, data)
      .then((r) => (r as any).data),

  /**
   * Lịch sử kiểm kê của sản phẩm, mới nhất trước
   */
  getHistory: (productId: string) =>
    api
      .get<ApiResponse<StockCount[]>>(`/stock-counts/${productId}`)
      .then((r) => (r as any).data),

  /**
   * Chi tiết phiếu kiểm kê
   */
  getDetail: (stockCountId: number) =>
    api
      .get<ApiResponse<StockCount>>(`/stock-counts/${stockCountId}`)
      .then((r) => (r as any).data),
};
