import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/helpers";
import type { ForecastResult } from "@/types/forecast";
import { getMapeLevel, getModelLabel } from "@/types/forecast";

interface ForecastChartProps {
  result: ForecastResult;
  onUseForecast: (q: number) => void;
  onManualInput: () => void;
}

export default function ForecastChart({
  result,
  onUseForecast,
  onManualInput,
}: ForecastChartProps) {
  const mapeLevel = getMapeLevel(result.mape);
  const changePrev =
    result.previousQ > 0
      ? ((result.forecastQ - result.previousQ) / result.previousQ) * 100
      : null;
  const changeAvg6 =
    result.avg6Q > 0
      ? ((result.forecastQ - result.avg6Q) / result.avg6Q) * 100
      : null;

  // Use historicalPoints if points are empty
  const chartData = useMemo(() => {
    console.log("Rendering ForecastChart with result:", result);
    return result.points.length > 0
      ? result.points
      : result.historicalPoints || [];
  }, [result.points, result.historicalPoints]);

  // Find the "today" divider
  const todayPeriod = useMemo(() => {
    const lastActual = chartData.filter((p) => p.actual !== null).pop();
    return lastActual?.period || "";
  }, [chartData]);

  const forecastPoint = chartData.find((p) => p.forecastValue !== null);

  return (
    <div className="bg-white border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold font-display text-gray-900">
              {result.productName} — Dự đoán
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {getModelLabel(result.model)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                MAPE: {result.mape}%
              </span>
              <Badge
                className={cn(
                  "text-xs",
                  mapeLevel === "high" &&
                    "bg-status-success text-primary-foreground",
                  mapeLevel === "medium" &&
                    "bg-status-warning text-primary-foreground",
                  mapeLevel === "low" &&
                    "bg-destructive text-destructive-foreground",
                )}
              >
                {mapeLevel === "high" && "✓ Tin cậy cao"}
                {mapeLevel === "medium" && "⚠️ Chấp nhận được"}
                {mapeLevel === "low" && "✗ Cần xem xét lại"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ({result.dataPointsUsed} điểm dữ liệu)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Summary */}
      <div className="flex flex-col lg:flex-row">
        {/* Chart */}
        <div className="flex-1 p-5">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                {/* Gradient bóng cho đường Thực tế — indigo */}
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                {/* Gradient bóng cho đường Dự đoán — emerald */}
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                {/* Confidence band */}
                <linearGradient id="gradConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const [y, m] = v.split("-");
                  return `T${parseInt(m)}/${y.slice(2)}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatNumber(v, 0)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 min-w-[160px]">
                      <p className="text-xs text-gray-400 mb-2">{label}</p>
                      {payload.map((entry: any, index: number) => {
                        if (
                          entry.name === "upperBound" ||
                          entry.name === "lowerBound"
                        )
                          return null;
                        const labels: Record<string, string> = {
                          actual: "Thực tế",
                          planned: "Kế hoạch cũ",
                          forecastValue: "Dự đoán",
                        };
                        const name = labels[entry.name] || entry.name;
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center gap-4 text-sm mb-1 last:mb-0"
                          >
                            <span
                              className="font-medium"
                              style={{ color: entry.color }}
                            >
                              {name}
                            </span>
                            <span className="font-bold font-mono text-gray-900">
                              {formatNumber(entry.value)} {result.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    actual: "Thực tế",
                    planned: "Kế hoạch cũ",
                    forecastValue: "Dự đoán",
                  };
                  return labels[value] || value;
                }}
              />

              {/* Confidence band */}
              <Area
                dataKey="upperBound"
                stroke="none"
                fill="url(#gradConfidence)"
                fillOpacity={1}
                name="upperBound"
                legendType="none"
              />
              <Area
                dataKey="lowerBound"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name="lowerBound"
                legendType="none"
              />

              {/* Bóng gradient dưới đường thực tế */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="none"
                fill="url(#gradActual)"
                fillOpacity={1}
                legendType="none"
                name="actual_area"
                connectNulls={false}
                dot={false}
                activeDot={false}
              />
              {/* Bóng gradient dưới đường dự đoán */}
              <Area
                type="monotone"
                dataKey="forecastValue"
                stroke="none"
                fill="url(#gradForecast)"
                fillOpacity={1}
                legendType="none"
                name="forecast_area"
                connectNulls={false}
                dot={false}
                activeDot={false}
              />

              {/* Today line */}
              {todayPeriod && (
                <ReferenceLine
                  x={todayPeriod}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{
                    value: "Hôm nay",
                    position: "top",
                    fontSize: 11,
                    fill: "#94A3B8",
                  }}
                />
              )}

              {/* Đường thực tế — indigo (màu chủ đạo) */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{
                  r: 6,
                  fill: "#6366F1",
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                connectNulls={false}
                name="actual"
              />
              {/* Kế hoạch cũ — gray dạt */}
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#CBD5E1"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                name="planned"
              />
              {/* Dự đoán — emerald */}
              <Line
                type="monotone"
                dataKey="forecastValue"
                stroke="#10B981"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{
                  r: 6,
                  fill: "#10B981",
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                connectNulls={false}
                name="forecastValue"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Panel */}
        {result.model !== "HISTORICAL_DATA_ONLY" && (
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-border p-5 space-y-4">
            {/* Forecast Q */}
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Dự đoán Q</p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {formatNumber(result.forecastQ)}{" "}
                <span className="text-sm font-normal">{result.unit}</span>
              </p>
            </div>

            {/* Comparisons */}
            {changePrev !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">So kỳ trước</span>
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    changePrev >= 0
                      ? "text-status-success"
                      : "text-destructive",
                  )}
                >
                  {changePrev >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {changePrev >= 0 ? "+" : ""}
                  {changePrev.toFixed(1)}%
                </span>
              </div>
            )}
            {changeAvg6 !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">So TB 6 kỳ</span>
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    changeAvg6 >= 0
                      ? "text-status-success"
                      : "text-destructive",
                  )}
                >
                  {changeAvg6 >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {changeAvg6 >= 0 ? "+" : ""}
                  {changeAvg6.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Confidence range */}
            {forecastPoint && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Khoảng tin cậy
                </p>
                <p className="font-mono font-medium text-foreground text-sm">
                  {formatNumber(forecastPoint.lowerBound!)} —{" "}
                  {formatNumber(forecastPoint.upperBound!)} {result.unit}
                </p>
              </div>
            )}

            {/* Seasonality */}
            {result.seasonalityInsight && (
              <div className="bg-primary/5 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground">
                    {result.seasonalityInsight}
                  </p>
                </div>
                {result.peakMonth && result.lowMonth && (
                  <p className="text-xs text-muted-foreground mt-2 ml-6">
                    Cao nhất: T{result.peakMonth.month} (+{result.peakMonth.pct}
                    %) · Thấp nhất: T{result.lowMonth.month} (
                    {result.lowMonth.pct}%)
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
