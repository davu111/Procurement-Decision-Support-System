import type { ForecastModel, ForecastPoint } from "@/types/forecast";

export interface BackendForecastResult {
  forecastValue: number;
  modelUsed: ForecastModel;
  mape: number; // Mean Absolute Percentage Error (%)
  dataPointsUsed: number;
  description: string;
  requiresManualInput: boolean;
  mapeWarning: boolean;
  nextModelUpgrade: string | null;
  seasonalIndices: number[] | null;
  forecastPoints: ForecastPoint[];
}

export interface ForecastSuggestionResponse {
  productId: number;
  planningUnit: "MONTH" | "QUARTER" | "YEAR";
  suggestedQ: number | null;
  demandForecast: BackendForecastResult;
  leadTimeForecast: BackendForecastResult;
  requiresManualInput: boolean;

  // Supplier service info (preview)
  supplierProductId: string | null;
  supplierName: string | null;
  currentSupplyRateK: number | null;
  currentFixedOrderCostA: number | null;
  currentUnitPriceC: number | null;
  currentLeadTimeDays: number | null;
}
