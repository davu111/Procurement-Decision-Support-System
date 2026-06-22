export interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryResult {
  id: number;
  InventoryParameterId: number;
  optimalOrderQtyS: number;
  optimalOrderCountN: number;
  optimalCycleTimeTau: number;
  maxInventoryLevel: number;
  avgInventoryLevel: number;
  reorderPointB: number;
  minTotalCost: number;
  totalCostWithPurchase: number;
  replenishmentTimeTn: number;
  mValue: number;
  demandQ: number;
  supplyRateK: number;
  fixedOrderCostA: number;
  unitPriceC: number;
  storageCoefficientI: number;
  leadTimeL: number;
  kMinusQFactor: number;
  // Lead time warning fields
  leadTimeDeviationWarning?: boolean;
  leadTimeDeviationMessage?: string;
  leadTimeSourceUsed?: "COMMITTED" | "FORECAST" | "MANUAL";
}

export interface ForecastSuggestion {
  productId: string;
  planningUnit: string;
  suggestedQ: number;
  requiresManualInput: boolean;
  supplierName: string;
  supplierProductId: number;
  currentSupplyRateK: number;
  currentFixedOrderCostA: number;
  currentUnitPriceC: number;
  currentLeadTimeDays: number;
  demandForecast: {
    forecastValue: number;
    modelUsed: string;
    dataPointsUsed: number;
    mape: number | null;
    mapeWarning: boolean;
  };
  leadTimeForecast: {
    forecastValue: number;
    modelUsed: string;
    dataPointsUsed: number;
    mape: number | null;
    mapeWarning: boolean;
  };
}

export interface WarehouseConfig {
  id: number;
  configName: string;
  interestRate: number;
  warehouseMonthlyCost: number;
  warehouseMaxCapacity: number;
  spoilageRate: number;
  insuranceRate: number;
  storageCostCoefficient: number;
  isDefault: boolean;
}

export interface ConsumptionHistory {
  id?: number;
  productId: string;
  planningUnit: string;
  periodStartDate: string;
  periodEndDate: string;
  actualConsumption: number;
  plannedConsumption: number;
  actualLeadTimeDays: number | null;
  actualSupplyRate: number | null;
  notes: string;
}
export type UrgencyLevel = "red" | "yellow" | "green";

/**
 * Kết quả đánh giá độ tin cậy nhà cung cấp
 * Tương ứng SupplierReliabilityResponse.java
 */
export interface SupplierReliability {
  productId: string;
  committedLeadTimeDays: number | null;
  avgActualLeadTimeDays: number | null;
  stdDevLeadTimeDays: number | null;
  deviationRate: number | null;           // (avg - committed) / committed
  reliabilityLevel: "RELIABLE" | "MODERATE" | "UNRELIABLE" | "UNKNOWN";
  dataPointsUsed: number;
  recommendation: string;
  forecastLeadTimeDays: number | null;    // WMA forecast (ngày)
}
