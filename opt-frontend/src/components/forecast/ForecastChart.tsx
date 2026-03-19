import { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Lightbulb, CheckCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/helpers';
import type { ForecastResult } from '@/types/forecast';
import { getMapeLevel, getModelLabel } from '@/types/forecast';

interface ForecastChartProps {
  result: ForecastResult;
  onUseForecast: (q: number) => void;
  onManualInput: () => void;
}

export default function ForecastChart({ result, onUseForecast, onManualInput }: ForecastChartProps) {
  const mapeLevel = getMapeLevel(result.mape);
  const changePrev = result.previousQ > 0
    ? ((result.forecastQ - result.previousQ) / result.previousQ) * 100
    : null;
  const changeAvg6 = result.avg6Q > 0
    ? ((result.forecastQ - result.avg6Q) / result.avg6Q) * 100
    : null;

  // Find the "today" divider
  const todayPeriod = useMemo(() => {
    const lastActual = result.points.filter(p => p.actual !== null).pop();
    return lastActual?.period || '';
  }, [result.points]);

  const forecastPoint = result.points.find(p => p.forecast !== null);

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {result.productName} — Dự đoán
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">
                {getModelLabel(result.model)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                MAPE: {result.mape}%
              </span>
              <Badge className={cn(
                "text-xs",
                mapeLevel === 'high' && "bg-status-success text-primary-foreground",
                mapeLevel === 'medium' && "bg-status-warning text-primary-foreground",
                mapeLevel === 'low' && "bg-destructive text-destructive-foreground",
              )}>
                {mapeLevel === 'high' && '✓ Tin cậy cao'}
                {mapeLevel === 'medium' && '⚠️ Chấp nhận được'}
                {mapeLevel === 'low' && '✗ Cần xem xét lại'}
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
            <ComposedChart data={result.points} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: string) => {
                  const [y, m] = v.split('-');
                  return `T${parseInt(m)}/${y.slice(2)}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => formatNumber(v, 0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    actual: 'Thực tế',
                    planned: 'Kế hoạch cũ',
                    forecast: 'Dự đoán',
                  };
                  return [formatNumber(value) + ' ' + result.unit, labels[name] || name];
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    actual: 'Thực tế',
                    planned: 'Kế hoạch cũ',
                    forecast: 'Dự đoán',
                  };
                  return labels[value] || value;
                }}
              />

              {/* Confidence band */}
              <Area
                dataKey="upperBound"
                stroke="none"
                fill="hsl(25, 95%, 53%)"
                fillOpacity={0.1}
                name="upperBound"
                legendType="none"
              />
              <Area
                dataKey="lowerBound"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
                name="lowerBound"
                legendType="none"
              />

              {/* Today line */}
              {todayPeriod && (
                <ReferenceLine
                  x={todayPeriod}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ value: 'Hôm nay', position: 'top', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
              )}

              {/* Lines */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(210, 70%, 40%)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'hsl(210, 70%, 40%)' }}
                connectNulls={false}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
                name="planned"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(25, 95%, 53%)"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={{ r: 4, fill: 'hsl(25, 95%, 53%)' }}
                connectNulls={false}
                name="forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Panel */}
        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-border p-5 space-y-4">
          {/* Forecast Q */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dự đoán Q</p>
            <p className="text-2xl font-bold font-mono text-foreground">
              {formatNumber(result.forecastQ)} <span className="text-sm font-normal">{result.unit}</span>
            </p>
          </div>

          {/* Comparisons */}
          {changePrev !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">So kỳ trước</span>
              <span className={cn("flex items-center gap-1 font-medium", changePrev >= 0 ? "text-status-success" : "text-destructive")}>
                {changePrev >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {changePrev >= 0 ? '+' : ''}{changePrev.toFixed(1)}%
              </span>
            </div>
          )}
          {changeAvg6 !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">So TB 6 kỳ</span>
              <span className={cn("flex items-center gap-1 font-medium", changeAvg6 >= 0 ? "text-status-success" : "text-destructive")}>
                {changeAvg6 >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {changeAvg6 >= 0 ? '+' : ''}{changeAvg6.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Confidence range */}
          {forecastPoint && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Khoảng tin cậy</p>
              <p className="font-mono font-medium text-foreground text-sm">
                {formatNumber(forecastPoint.lowerBound!)} — {formatNumber(forecastPoint.upperBound!)} {result.unit}
              </p>
            </div>
          )}

          {/* Seasonality */}
          {result.seasonalityInsight && (
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">{result.seasonalityInsight}</p>
              </div>
              {result.peakMonth && result.lowMonth && (
                <p className="text-xs text-muted-foreground mt-2 ml-6">
                  Cao nhất: T{result.peakMonth.month} (+{result.peakMonth.pct}%) · Thấp nhất: T{result.lowMonth.month} ({result.lowMonth.pct}%)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-border p-5 flex items-center gap-3">
        <Button
          onClick={() => onUseForecast(result.forecastQ)}
          disabled={mapeLevel === 'low'}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Dùng giá trị dự đoán: {formatNumber(result.forecastQ)} {result.unit}
        </Button>
        <Button variant="outline" onClick={onManualInput} className="gap-2">
          <Edit3 className="h-4 w-4" />
          Nhập thủ công
        </Button>
        {mapeLevel === 'low' && (
          <span className="text-xs text-destructive">MAPE &gt; 20% — vui lòng nhập thủ công</span>
        )}
      </div>
    </div>
  );
}
