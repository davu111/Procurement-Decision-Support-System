export interface StockCount {
  id: number;
  productId: string;
  countDate: string; // YYYY-MM-DD
  systemQuantity: number;
  actualQuantity: number | null;
  varianceQty: number | null;
  varianceRate: number | null; // 0.05 = 5%
  varianceValue: number | null; // VND
  countedBy: string | null;
  notes: string | null;
  status: "DRAFT" | "CONFIRMED";
  lossWarning?: boolean; // cảnh báo thất thoát > 5%
  createdAt: string;
  confirmedAt: string | null;
}

export interface CreateStockCountRequest {
  productId: string;
  countDate: string; // YYYY-MM-DD
  countedBy?: string;
}

export interface ConfirmStockCountRequest {
  actualQuantity: number;
  notes?: string;
}
