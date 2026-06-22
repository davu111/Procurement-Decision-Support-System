import type { SupplierReliability } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart2,
} from "lucide-react";

interface Props {
  data: SupplierReliability;
  unit?: string;
}

/** Màu và icon theo reliabilityLevel */
function getLevelConfig(level: SupplierReliability["reliabilityLevel"]) {
  switch (level) {
    case "RELIABLE":
      return {
        icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
        badge: (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            Đáng tin cậy ✓
          </Badge>
        ),
        bg: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-700",
      };
    case "MODERATE":
      return {
        icon: <ShieldAlert className="h-5 w-5 text-amber-500" />,
        badge: (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            Trung bình ⚠
          </Badge>
        ),
        bg: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
      };
    case "UNRELIABLE":
      return {
        icon: <ShieldX className="h-5 w-5 text-red-500" />,
        badge: (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            Kém tin cậy ✗
          </Badge>
        ),
        bg: "bg-red-50 border-red-200",
        text: "text-red-700",
      };
    default:
      return {
        icon: <HelpCircle className="h-5 w-5 text-gray-400" />,
        badge: <Badge variant="secondary">Chưa xác định</Badge>,
        bg: "bg-gray-50 border-gray-200",
        text: "text-gray-600",
      };
  }
}

function DeviationIcon({ rate }: { rate: number | null }) {
  if (rate === null) return null;
  if (rate > 0.02) return <TrendingUp className="h-3.5 w-3.5 text-red-500" />;
  if (rate < -0.02)
    return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

export default function SupplierReliabilityPanel({ data, unit }: Props) {
  const cfg = getLevelConfig(data.reliabilityLevel);
  const hasData = data.dataPointsUsed > 0;

  const deviationPct =
    data.deviationRate !== null
      ? (data.deviationRate * 100).toFixed(1)
      : null;

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${cfg.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {cfg.icon}
        <span className="font-semibold text-sm text-foreground">
          Độ tin cậy nhà cung cấp
        </span>
        {cfg.badge}
        {hasData && (
          <span className="ml-auto text-xs text-muted-foreground">
            {data.dataPointsUsed} kỳ dữ liệu
          </span>
        )}
      </div>

      {hasData ? (
        <>
          {/* Bảng so sánh */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-white/70 rounded-md p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Cam kết NCC</p>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {data.committedLeadTimeDays ?? "—"} ngày
              </p>
            </div>
            <div className="bg-white/70 rounded-md p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Thực tế TB</p>
              <p className="font-mono font-bold text-foreground mt-0.5">
                {data.avgActualLeadTimeDays?.toFixed(1) ?? "—"} ngày
              </p>
            </div>
            <div className="bg-white/70 rounded-md p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Độ dao động</p>
              <p className="font-mono font-bold text-foreground mt-0.5">
                ±{data.stdDevLeadTimeDays?.toFixed(1) ?? "—"} ngày
              </p>
            </div>
          </div>

          {/* Deviation rate */}
          {deviationPct !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sai lệch:</span>
              <DeviationIcon rate={data.deviationRate} />
              <span className={`font-semibold ${cfg.text}`}>
                {data.deviationRate! > 0 ? "+" : ""}
                {deviationPct}%
              </span>
              {data.deviationRate! > 0 ? (
                <span className="text-xs text-muted-foreground">
                  (giao trễ hơn cam kết)
                </span>
              ) : data.deviationRate! < 0 ? (
                <span className="text-xs text-muted-foreground">
                  (giao sớm hơn cam kết)
                </span>
              ) : null}
            </div>
          )}

          {/* Forecast lead time (tham khảo) */}
          {data.forecastLeadTimeDays !== null && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs">Dự báo WMA:</span>
              <span className="font-mono font-medium text-foreground">
                {data.forecastLeadTimeDays.toFixed(1)} ngày
              </span>
              <span className="text-xs">(tham khảo)</span>
            </div>
          )}

          {/* Recommendation */}
          <div
            className={`flex items-start gap-2 text-sm ${cfg.text} bg-white/60 rounded-md px-3 py-2`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
            <span>{data.recommendation}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{data.recommendation}</p>
      )}
    </div>
  );
}
