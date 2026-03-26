import type {
  ConsumptionRecord,
  ForecastResult,
  ForecastModel,
  ForecastPoint,
} from "@/types/forecast";
import type { ForecastSuggestionResponse } from "../types/inventory-opt/forecast-suggestion";

/**
 * Dùng response từ backend (/api/inventory/suggest) + consumption history
 * để tạo ForecastResult đầy đủ cho frontend hiển thị
 */
export function completeForecastDataFromBackend(
  backendResponse: ForecastSuggestionResponse,
  consumptionRecords: ConsumptionRecord[],
  product: { id: number; name: string; unit: string },
): ForecastResult {
  const { demandForecast } = backendResponse;

  const sorted = [...consumptionRecords]
    .filter((r) => r.productId === product.id)
    .sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));

  const values = sorted.map((r) => r.actualConsumption);

  const modelString = demandForecast.modelUsed as string;
  let model: ForecastModel = "WMA";
  if (
    ["MANUAL", "WMA", "HOLT_WINTERS", "SEASONAL_REGRESSION"].includes(
      modelString,
    )
  ) {
    model = modelString as ForecastModel;
  }

  // === History points — forecastValue luôn null cho điểm lịch sử ===
  const points: ForecastPoint[] = sorted.map((r) => ({
    period: r.periodStartDate.substring(0, 7),
    actual: r.actualConsumption,
    planned: r.plannedConsumption ?? null,
    forecastValue: null, // ✅ đúng field, null vì đây là điểm lịch sử
    upperBound: null,
    lowerBound: null,
  }));

  // === Forecast points từ backend — actual luôn null cho điểm dự đoán ===
  if (
    demandForecast.forecastPoints &&
    demandForecast.forecastPoints.length > 0
  ) {
    for (const fp of demandForecast.forecastPoints) {
      points.push({
        period: fp.period,
        actual: null,
        planned: null,
        forecastValue: fp.forecastValue, // ✅ đúng field
        upperBound: fp.upperBound,
        lowerBound: fp.lowerBound,
      });
    }
  }

  const lastDate =
    sorted.length > 0
      ? new Date(sorted[sorted.length - 1].periodStartDate)
      : new Date();

  // === Seasonality insight ===
  let seasonalityInsight: string | null = null;
  let peakMonth: { month: number; pct: number } | null = null;
  let lowMonth: { month: number; pct: number } | null = null;

  if (values.length >= 12) {
    const monthAvgs = new Array(12).fill(0);
    const monthCounts = new Array(12).fill(0);
    sorted.forEach((r) => {
      const m = new Date(r.periodStartDate).getMonth();
      monthAvgs[m] += r.actualConsumption;
      monthCounts[m]++;
    });
    const overallAvg = values.reduce((s, v) => s + v, 0) / values.length;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > 0) monthAvgs[i] /= monthCounts[i];
    }
    let maxPct = -Infinity,
      minPct = Infinity,
      maxM = 0,
      minM = 0;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] === 0) continue;
      const pct = ((monthAvgs[i] - overallAvg) / overallAvg) * 100;
      if (pct > maxPct) {
        maxPct = pct;
        maxM = i + 1;
      }
      if (pct < minPct) {
        minPct = pct;
        minM = i + 1;
      }
    }
    const nextMonthIdx = (lastDate.getMonth() + 1) % 12;
    if (monthCounts[nextMonthIdx] > 0) {
      const pct = ((monthAvgs[nextMonthIdx] - overallAvg) / overallAvg) * 100;
      const direction = pct >= 0 ? "cao hơn" : "thấp hơn";
      const years = Math.floor(values.length / 12);
      seasonalityInsight = `Tháng ${nextMonthIdx + 1} thường ${direction} trung bình ${Math.abs(pct).toFixed(0)}% (dựa trên ${years} năm lịch sử)`;
    }
    peakMonth = { month: maxM, pct: Math.round(maxPct) };
    lowMonth = { month: minM, pct: Math.round(minPct) };
  }

  const previousQ = values.length > 0 ? values[values.length - 1] : 0;
  const last6 = values.slice(-6);
  const avg6Q =
    last6.length > 0
      ? Math.round((last6.reduce((s, v) => s + v, 0) / last6.length) * 100) /
        100
      : 0;

  return {
    productId: product.id,
    productName: product.name,
    model,
    mape: Math.round((demandForecast.mape ?? 20) * 10) / 10,
    dataPointsUsed: demandForecast.dataPointsUsed || values.length,
    forecastQ:
      demandForecast.forecastPoints?.[0]?.forecastValue ??
      demandForecast.forecastValue ??
      0,
    previousQ,
    avg6Q,
    unit: product.unit,
    points, // ✅ đúng kiểu ForecastPoint[], không còn lỗi type
    seasonalityInsight,
    peakMonth,
    lowMonth,
  };
}
