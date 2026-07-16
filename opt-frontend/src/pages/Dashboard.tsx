import { LayoutDashboard, TrendingUp, HelpCircle, Flame, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupplyStatusDashboard from "@/components/inventory/SupplyStatusDashboard";
import InventoryVelocityDashboard from "@/components/inventory/InventoryVelocityDashboard";
import ForecastPage from "./ForecastPage";
import HeatmapPage from "./HeatmapPage";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900 tracking-tight">
              Trang chủ
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Hệ thống tối ưu hóa và cảnh báo chuỗi cung ứng hàng tồn kho
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────────── */}
      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 border h-11 w-full sm:w-auto flex sm:inline-flex justify-start overflow-x-auto">
          <TabsTrigger value="forecast" className="gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
            <HelpCircle className="h-4 w-4 shrink-0" />
            Dự báo Tiêu thụ
          </TabsTrigger>
          <TabsTrigger value="supply-status" className="gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
            <TrendingUp className="h-4 w-4 shrink-0" />
            Cân đối Cung Ứng
          </TabsTrigger>
          <TabsTrigger value="inventory-velocity" className="gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
            <Zap className="h-4 w-4 shrink-0" />
            Tốc độ Luân chuyển
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-2 px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-primary transition-all">
            <Flame className="h-4 w-4 shrink-0" />
            Bản đồ Nhiệt Kho
          </TabsTrigger>
        </TabsList>
        <TabsContent value="supply-status" className="focus-visible:outline-none">
          <SupplyStatusDashboard />
        </TabsContent>

        <TabsContent value="inventory-velocity" className="focus-visible:outline-none">
          <InventoryVelocityDashboard />
        </TabsContent>

        <TabsContent value="forecast" className="focus-visible:outline-none">
          <ForecastPage />
        </TabsContent>

        <TabsContent value="heatmap" className="focus-visible:outline-none">
          <HeatmapPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
