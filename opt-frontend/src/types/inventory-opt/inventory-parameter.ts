export interface InventoryParameterResponse {
  id: number;
  productId: string;
  warehouseConfigId: number;
  supplierProductId: string; // UUID -> string
  planStartDate: string; // LocalDate -> ISO string (yyyy-MM-dd)
  planEndDate: string;
  scheduleStartDate: string;
  demandQ: number;
  storageCostCoefficientI: number;
  snapshotSupplyRateK: number; // K
  snapshotFixedOrderCostA: number; // A
  snapshotUnitPriceC: number; // C
  snapshotLeadTimeL: number; // L
  supplierDataSource: string;
  status: string; // default "ACTIVE"
  initialInventory: number;
  scheduledReceiptQty: number;
  scheduledReceiptDate: string;
  qIsSuggested: boolean; // default false
  suggestionModel: string;
  suggestionMape: number;
  createdAt: string; // LocalDateTime -> ISO string
  updatedAt: string;
}
