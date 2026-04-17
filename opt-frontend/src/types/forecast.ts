export interface ConsumptionRecord {
  productId: number;
  periodStartDate: string;
  periodEndDate: string;
  actualConsumption: number;
  plannedConsumption: number | null;
  actualLeadTimeDays: number;
  actualSupplyRate: number | null;
  notes: string;
}

export interface ExternalFactor {
  periodStartDate: string;
  month: number;
  quarter: number;
  isTetHoliday: boolean;
  isSummer: boolean;
  isYearEnd: boolean;
  workingDays: number;
  avgTemperature: number | null;
  promotionFlag: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  type: "hard" | "soft";
}

export interface ImportResult {
  records: ConsumptionRecord[];
  hardErrors: ValidationError[];
  softWarnings: ValidationError[];
  totalRows: number;
}

export type ForecastModel =
  | "MANUAL"
  | "WMA"
  | "HOLT_WINTERS"
  | "SEASONAL_REGRESSION"
  | "HISTORICAL_DATA_ONLY";

export interface ForecastPoint {
  period: string;
  forecastValue: number | null;
  actual: number | null;
  planned: number | null;
  upperBound: number | null;
  lowerBound: number | null;
}

export interface ForecastResult {
  productId: number;
  productName: string;
  model: ForecastModel;
  mape: number;
  dataPointsUsed: number;
  forecastQ: number;
  previousQ: number;
  avg6Q: number;
  unit: string;
  points: ForecastPoint[];
  seasonalityInsight: string | null;
  peakMonth: { month: number; pct: number } | null;
  lowMonth: { month: number; pct: number } | null;
  historicalPoints?: ForecastPoint[];
}

export type MapeLevel = "high" | "medium" | "low";

export function getMapeLevel(mape: number): MapeLevel {
  if (mape < 10) return "high";
  if (mape <= 20) return "medium";
  return "low";
}

export function getModelForDataPoints(count: number): ForecastModel {
  if (count < 6) return "WMA";
  if (count <= 18) return "HOLT_WINTERS";
  return "SEASONAL_REGRESSION";
}

export function getModelLabel(model: ForecastModel): string {
  switch (model) {
    case "MANUAL":
      return "Nhập tay";
    case "WMA":
      return "Weighted Moving Average";
    case "HOLT_WINTERS":
      return "Holt-Winters";
    case "SEASONAL_REGRESSION":
      return "Seasonal Regression";
  }
}

export function getDataQualityMessage(count: number): {
  icon: string;
  message: string;
} {
  if (count < 6)
    return { icon: "⚠️", message: "Cần thêm dữ liệu để dự đoán tốt hơn" };
  if (count <= 18)
    return { icon: "ℹ️", message: "Đủ dữ liệu cho dự đoán có trend theo mùa" };
  return { icon: "✓", message: "Mô hình đầy đủ, kết quả tin cậy" };
}

export interface ConsumptionPoint {
  period: string;
  value: number;
}
