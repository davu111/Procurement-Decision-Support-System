import type { ConsumptionRecord } from '@/types/forecast';
import type { ForecastPoint, ForecastResult, ForecastModel } from '@/types/forecast';
import { getModelForDataPoints } from '@/types/forecast';

// Weighted Moving Average (weights: most recent = highest)
function wmaForecast(values: number[], periods: number = 3): number {
  const n = Math.min(periods, values.length);
  const slice = values.slice(-n);
  const totalWeight = (n * (n + 1)) / 2;
  return slice.reduce((sum, v, i) => sum + v * (i + 1), 0) / totalWeight;
}

// Simple Holt-Winters additive (simplified for frontend demo)
function holtWintersForecast(values: number[], seasonLength: number = 12): { forecast: number; trend: number; seasonal: number[] } {
  const n = values.length;
  const alpha = 0.3, beta = 0.1, gamma = 0.3;

  // Initialize
  let level = values.slice(0, Math.min(seasonLength, n)).reduce((s, v) => s + v, 0) / Math.min(seasonLength, n);
  let trend = n >= seasonLength * 2
    ? (values.slice(seasonLength, seasonLength * 2).reduce((s, v) => s + v, 0) - values.slice(0, seasonLength).reduce((s, v) => s + v, 0)) / (seasonLength * seasonLength)
    : 0;

  const seasonal = new Array(seasonLength).fill(0);
  if (n >= seasonLength) {
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] = values[i] - level;
    }
  }

  // Update
  for (let t = 0; t < n; t++) {
    const si = t % seasonLength;
    const prevLevel = level;
    level = alpha * (values[t] - seasonal[si]) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[si] = gamma * (values[t] - level) + (1 - gamma) * seasonal[si];
  }

  const nextSi = n % seasonLength;
  return {
    forecast: level + trend + seasonal[nextSi],
    trend,
    seasonal,
  };
}

// Calculate MAPE from last few cross-validated predictions
function calculateMape(values: number[]): number {
  if (values.length < 4) return 25; // not enough data
  const testSize = Math.min(3, Math.floor(values.length / 3));
  let totalError = 0;
  for (let i = values.length - testSize; i < values.length; i++) {
    const train = values.slice(0, i);
    const predicted = wmaForecast(train);
    totalError += Math.abs((values[i] - predicted) / values[i]);
  }
  return (totalError / testSize) * 100;
}

export function generateForecast(
  records: ConsumptionRecord[],
  productCode: string,
  productName: string,
  unit: string,
  forecastPeriods: number = 3
): ForecastResult {
  const sorted = [...records]
    .filter(r => r.productCode === productCode)
    .sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));

  const values = sorted.map(r => r.actualConsumption);
  const model = getModelForDataPoints(values.length);
  const mape = calculateMape(values);

  // Generate forecast values
  let forecastValues: number[] = [];
  if (model === 'WMA') {
    for (let i = 0; i < forecastPeriods; i++) {
      const allVals = [...values, ...forecastValues];
      forecastValues.push(wmaForecast(allVals));
    }
  } else {
    // Holt-Winters or Seasonal Regression (simplified)
    const hw = holtWintersForecast(values);
    for (let i = 0; i < forecastPeriods; i++) {
      const si = (values.length + i) % 12;
      forecastValues.push(hw.forecast + hw.trend * i + (hw.seasonal[si] || 0));
    }
  }

  // Build points
  const points: ForecastPoint[] = [];

  // History points
  sorted.forEach(r => {
    points.push({
      period: r.periodStartDate.substring(0, 7), // YYYY-MM
      actual: r.actualConsumption,
      planned: r.plannedConsumption,
      forecast: null,
      upperBound: null,
      lowerBound: null,
    });
  });

  // Forecast points
  const lastDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].periodStartDate) : new Date();
  for (let i = 0; i < forecastPeriods; i++) {
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + i + 1);
    const fv = Math.max(0, forecastValues[i]);
    const band = fv * (mape / 100);
    points.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      actual: null,
      planned: null,
      forecast: Math.round(fv * 100) / 100,
      upperBound: Math.round((fv + band) * 100) / 100,
      lowerBound: Math.round(Math.max(0, fv - band) * 100) / 100,
    });
  }

  const forecastQ = forecastValues[0] || 0;
  const previousQ = values.length > 0 ? values[values.length - 1] : 0;
  const last6 = values.slice(-6);
  const avg6Q = last6.length > 0 ? last6.reduce((s, v) => s + v, 0) / last6.length : 0;

  // Seasonality insight
  let seasonalityInsight: string | null = null;
  let peakMonth: { month: number; pct: number } | null = null;
  let lowMonth: { month: number; pct: number } | null = null;

  if (values.length >= 12 && (model === 'HOLT_WINTERS' || model === 'SEASONAL_REGRESSION')) {
    const monthAvgs = new Array(12).fill(0);
    const monthCounts = new Array(12).fill(0);
    sorted.forEach(r => {
      const m = new Date(r.periodStartDate).getMonth();
      monthAvgs[m] += r.actualConsumption;
      monthCounts[m]++;
    });
    const overallAvg = values.reduce((s, v) => s + v, 0) / values.length;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > 0) monthAvgs[i] /= monthCounts[i];
    }

    let maxPct = -Infinity, minPct = Infinity, maxM = 0, minM = 0;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] === 0) continue;
      const pct = ((monthAvgs[i] - overallAvg) / overallAvg) * 100;
      if (pct > maxPct) { maxPct = pct; maxM = i + 1; }
      if (pct < minPct) { minPct = pct; minM = i + 1; }
    }

    const nextMonth = lastDate.getMonth() + 2;
    const nextMonthIdx = ((nextMonth - 1) % 12);
    if (monthCounts[nextMonthIdx] > 0) {
      const pct = ((monthAvgs[nextMonthIdx] - overallAvg) / overallAvg) * 100;
      const direction = pct >= 0 ? 'cao hơn' : 'thấp hơn';
      const years = Math.floor(values.length / 12);
      seasonalityInsight = `Tháng ${nextMonthIdx + 1} thường ${direction} trung bình ${Math.abs(pct).toFixed(0)}% (dựa trên ${years} năm lịch sử)`;
    }
    peakMonth = { month: maxM, pct: Math.round(maxPct) };
    lowMonth = { month: minM, pct: Math.round(minPct) };
  }

  return {
    productCode,
    productName,
    model,
    mape: Math.round(mape * 10) / 10,
    dataPointsUsed: values.length,
    forecastQ: Math.round(forecastQ * 100) / 100,
    previousQ,
    avg6Q: Math.round(avg6Q * 100) / 100,
    unit,
    points,
    seasonalityInsight,
    peakMonth,
    lowMonth,
  };
}
