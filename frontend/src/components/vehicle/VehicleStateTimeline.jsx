import {
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  CheckCircle2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap = {
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  CheckCircle2,
  LogOut,
  AlertTriangle,
};

export function VehicleStateTimeline({ currentState = null }) {
  // Define all vehicle states S0-S10
  const allStates = [
    { stateCode: "S0", label: "Chưa đăng ký", icon: "Clock" },
    { stateCode: "S1", label: "Đã đăng ký – chờ vào", icon: "AlertCircle" },
    { stateCode: "S2", label: "Đã vào cổng", icon: "CheckCircle" },
    { stateCode: "S3", label: "Đang di chuyển nội bộ", icon: "Zap" },
    { stateCode: "S4", label: "Đến đúng kho", icon: "CheckCircle" },
    { stateCode: "S5", label: "Chờ bốc/dỡ", icon: "Clock" },
    { stateCode: "S6", label: "Đang bốc/dỡ hàng", icon: "Zap" },
    { stateCode: "S7", label: "Hoàn tất bốc/dỡ", icon: "CheckCircle2" },
    { stateCode: "S8", label: "Chờ xác nhận xuất kho", icon: "Clock" },
    { stateCode: "S9", label: "Đã xuất kho", icon: "LogOut" },
    { stateCode: "S10", label: "Vi phạm", icon: "AlertTriangle" },
  ];

  // Find current state index
  const currentStateIndex = allStates.findIndex(
    (s) => s.stateCode === currentState,
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Sơ đồ trạng thái xe</h3>
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-5.5 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary to-muted" />

        {/* Timeline Items */}
        <div className="space-y-6">
          {allStates.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Clock;
            const isCurrent = item.stateCode === currentState;
            const isCompleted =
              currentStateIndex >= 0 && index < currentStateIndex;

            return (
              <div key={item.stateCode} className="relative flex gap-8 pl-16">
                {/* Icon Circle */}
                <div
                  className={`absolute left-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCurrent
                      ? "bg-blue-50 border-blue-500 text-blue-600 shadow-lg scale-110"
                      : isCompleted
                        ? "bg-green-50 border-green-500 text-green-600"
                        : item.stateCode === "S10"
                          ? "bg-red-50 border-red-300 text-red-500"
                          : "bg-white border-muted text-muted-foreground"
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium ${
                        isCurrent
                          ? "text-blue-600 font-bold"
                          : isCompleted
                            ? "text-green-600"
                            : item.stateCode === "S10"
                              ? "text-red-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      {item.stateCode} - {item.label}
                    </p>
                    {item.stateCode === "S10" && currentState === "S10" && (
                      <Badge className="bg-red-600 hover:bg-red-700">
                        Vi phạm
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VehicleStateTimeline;
