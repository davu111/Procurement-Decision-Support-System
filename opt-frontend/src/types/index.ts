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

export interface OrderSchedule {
  id: number;
  productId?: number;
  productCode?: string;
  productName?: string;
  orderSequence: number;
  orderDate: string;
  expectedDeliveryDate: string;
  orderQuantity: number;
  estimatedCost: number;
  isReorderWarning: boolean;
  actualOrderDate: string | null;
  actualDeliveryDate: string | null;
  actualQuantity: number | null;
}

export interface InventoryResult {
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
}

export interface ForecastSuggestion {
  productId: number;
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
  productId: number;
  planningUnit: string;
  periodStartDate: string;
  periodEndDate: string;
  actualConsumption: number;
  plannedConsumption: number;
  actualLeadTimeDays: number | null;
  actualSupplyRate: number | null;
  notes: string;
}

export type PlanningUnit = 'MONTH' | 'QUARTER' | 'YEAR';
export type UrgencyLevel = 'red' | 'yellow' | 'green';

export interface UrgencyInfo {
  level: UrgencyLevel;
  daysLeft: number | null;
  nextOrder: OrderSchedule | null;
}
