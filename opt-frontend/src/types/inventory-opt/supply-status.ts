export interface PendingReceipt {
  expectedDeliveryDate: string;
  quantity: number;
  isDelayed: boolean;
}

export interface SupplyStatus {
  productId: string;
  productName: string;
  currentInventory: number;
  /** WAREHOUSE = real-time từ warehouse-service | SIMULATED = mô phỏng (fallback) */
  inventorySource: 'WAREHOUSE' | 'SIMULATED';
  /** @deprecated không còn sử dụng */
  lastStockCountDate?: string | null;
  dailyConsumption: number;
  daysOfSupply: number | null;
  daysOfSupplyEffective: number | null;
  committedLeadTimeDays: number;
  status: 'CRITICAL' | 'WARNING' | 'OK';
  pendingReceipts: PendingReceipt[];
  nextScheduledOrderDate: string | null;
  processAlert: boolean;
}
