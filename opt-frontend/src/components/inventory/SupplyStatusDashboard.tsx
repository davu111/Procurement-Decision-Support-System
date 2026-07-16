import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  ArrowRight,
  TrendingDown,
  Search,
  RotateCcw,
  Truck,
  Calendar,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import api from "@/api/axiosConfig";
import { SupplyStatus } from "@/types/inventory-opt/supply-status";
import { formatNumber } from "@/utils/helpers";

export default function SupplyStatusDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<SupplyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyProcessAlerts, setOnlyProcessAlerts] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard/supply-status");
      // The API response is wrapped in ApiResponse or returned directly. 
      // Based on controller, it returns ApiResponse.success(result)
      const resData = response.data.data || response.data;
      if (Array.isArray(resData)) {
        setData(resData);
      } else {
        setData([]);
        console.error("Invalid API response format", response.data);
      }
    } catch (err) {
      console.error("Error fetching supply status:", err);
      setError("Không thể tải trạng thái cung ứng hàng tồn kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const metrics = useMemo(() => {
    let total = data.length;
    let critical = data.filter(item => item.status === "CRITICAL").length;
    let warning = data.filter(item => item.status === "WARNING").length;
    let processAlerts = data.filter(item => item.processAlert).length;
    let ok = data.filter(item => item.status === "OK").length;
    return { total, critical, warning, processAlerts, ok };
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    const statusOrder = { CRITICAL: 0, WARNING: 1, OK: 2 };
    return data
      .filter(item => {      const matchesSearch = 
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.productId.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "critical" && item.status === "CRITICAL") ||
        (statusFilter === "warning" && item.status === "WARNING") ||
        (statusFilter === "ok" && item.status === "OK") ||
        (statusFilter === "process_alerts" && item.processAlert);

      const matchesProcessAlert = !onlyProcessAlerts || item.processAlert;

      return matchesSearch && matchesStatus && matchesProcessAlert;
      })
      .sort((a, b) => {
        if (a.processAlert !== b.processAlert) return a.processAlert ? -1 : 1;
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return (a.daysOfSupply ?? 0) - (b.daysOfSupply ?? 0);
      });  
    }, [data, search, statusFilter, onlyProcessAlerts]);

  const handleAction = (productId: string, isReplan: boolean) => {
    navigate(`/new-plan?productId=${productId}&mode=${isReplan ? "create" : "replan"}`);
  };

  return (
    <div className="space-y-6">

      {/* Main Panel */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border-b">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Cân đối Cung Ứng Hàng Ngày</CardTitle>
            <CardDescription>
              Xem số ngày tồn kho khả dụng thực tế (DOS) dựa trên tốc độ tiêu thụ hàng ngày và các lô hàng đang về.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2 shrink-0 self-start md:self-auto">
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </Button>
        </CardHeader>
        
        {/* Filters bar */}
        <div className="p-4 bg-slate-50/50 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm sản phẩm theo tên, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div className="w-full flex flex-wrap gap-2 md:justify-end items-center">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
              <TabsList className="bg-white border">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-100">
                  Tất cả ({metrics.total})
                </TabsTrigger>
                <TabsTrigger value="critical" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                  Đặt gấp ({metrics.critical})
                </TabsTrigger>
                <TabsTrigger value="warning" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">
                  Sắp chạm ngưỡng ({metrics.warning})
                </TabsTrigger>
                <TabsTrigger value="process_alerts" className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700">
                  Lỗi quy trình ({metrics.processAlerts})
                </TabsTrigger>
                <TabsTrigger value="ok" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                  An toàn ({metrics.ok})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* List content */}
<CardContent className="p-0">
  {loading ? (
    <div className="p-12 text-center text-slate-500 font-medium">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3 align-middle" />
      Đang phân tích trạng thái tồn kho...
    </div>
  ) : error ? (
    <div className="p-12 text-center text-red-500 font-medium flex flex-col items-center justify-center gap-2">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p>{error}</p>
      <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">Thử lại</Button>
    </div>
  ) : filteredData.length === 0 ? (
    <div className="p-12 text-center text-slate-400">
      Không tìm thấy sản phẩm nào khớp với bộ lọc.
    </div>
  ) : (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
          <th className="w-8"></th>
          <th className="text-left py-2.5 px-4 font-semibold">Sản phẩm</th>
          <th className="text-right py-2.5 px-3 font-semibold">Tồn kho</th>
          <th className="text-left py-2.5 px-3 font-semibold w-48">DOS thực tế</th>
          <th className="text-center py-2.5 px-3 font-semibold">Trạng thái</th>
          <th className="text-right py-2.5 px-4 font-semibold">Đặt tiếp theo</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((item) => {
          const isCritical = item.status === "CRITICAL";
          const isWarning = item.status === "WARNING";
          const isExpanded = expandedIds.has(item.productId);
          const leadTime = item.committedLeadTimeDays;

          let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
          let barClass = "bg-emerald-500";
          let statusText = "An toàn";
          if (isCritical) {
            badgeClass = "bg-red-50 text-red-700 border-red-100";
            barClass = "bg-red-500";
            statusText = "Đặt gấp";
          } else if (isWarning) {
            badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
            barClass = "bg-amber-500";
            statusText = "Cảnh báo";
          }

          const dosRawVal = item.daysOfSupply ?? 0;
          const progressPercent = Math.min((dosRawVal / (leadTime * 2 || 30)) * 100, 100);
          const hasDetails = (item.pendingReceipts && item.pendingReceipts.length > 0) || item.processAlert;

          return (
            <React.Fragment key={item.productId}>
              <tr
                className={`border-b hover:bg-slate-50/50 cursor-pointer transition-colors ${item.processAlert ? "bg-rose-50/30" : ""}`}
                onClick={() => handleAction(item.productId, true)}
              >
                <td className="pl-4" onClick={(e) => { e.stopPropagation(); hasDetails && toggleExpand(item.productId); }}>
                  {hasDetails && (
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  )}
                </td>
                <td className="py-2.5 px-4">
                  <div className="font-medium text-slate-800">{item.productName}</div>
                  <div className="text-xs text-slate-400 font-mono">ID: {item.productId} · {formatNumber(item.dailyConsumption)}/ngày</div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                  {formatNumber(item.currentInventory)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barClass}`} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="font-mono text-xs text-slate-500 w-14 text-right shrink-0">
                      {item.daysOfSupply != null ? `${item.daysOfSupply}d` : "N/A"}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {item.processAlert ? (
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 animate-pulse gap-1">
                      <AlertTriangle className="h-3 w-3" />Lỗi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={badgeClass}>{statusText}</Badge>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-500 font-mono text-xs">
                  {item.nextScheduledOrderDate
                    ? new Date(item.nextScheduledOrderDate).toLocaleDateString("vi-VN")
                    : "Chưa lên lịch"}
                </td>
              </tr>

              {isExpanded && hasDetails && (
                <tr className="border-b bg-slate-50/30">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-4 pl-8">
                      {item.processAlert && (
                        <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Dưới ngưỡng B mà chưa có đơn đặt hàng
                        </div>
                      )}
                      {item.pendingReceipts?.map((r, idx) => (
                        <div key={idx} className="text-xs bg-white border rounded px-2.5 py-1.5 flex items-center gap-2 text-slate-600">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(r.expectedDeliveryDate).toLocaleDateString("vi-VN")} · {formatNumber(r.quantity)}
                          {r.isDelayed && <span className="text-amber-600 font-semibold ml-1">Trễ</span>}
                        </div>
                      ))}
                      <div className="ml-auto">
                        <Button
                          size="sm"
                          variant={isCritical || item.processAlert ? "default" : "outline"}
                          className={isCritical || item.processAlert ? "bg-red-600 hover:bg-red-700 text-white gap-1.5" : "gap-1.5"}
                          onClick={(e) => { e.stopPropagation(); handleAction(item.productId, true); }}
                        >
                          {isCritical || item.processAlert ? "Xử lý ngay" : "Lập kế hoạch"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  )}
</CardContent>
      </Card>
    </div>
  );
}
