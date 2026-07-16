import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  RotateCcw,
  Zap,
  ArrowUpDown,
  Search,
  Filter,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  HelpCircle
} from "lucide-react";
import api from "@/api/axiosConfig";
import { productCategoryApi } from "@/api/productCategoryApi";
import type { ProductCategory } from "@/types/product/productCategory";
import type {
  InventoryVelocityResponse,
  ProductVelocity
} from "@/types/inventory-opt/inventory-velocity";
import { formatCurrency, formatNumber, formatDate } from "@/utils/helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  ReferenceArea
} from "recharts";

// Helper functions for dates
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDate12MonthsAgoString(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 12);
  return d.toISOString().split("T")[0];
}

// Color maps
const COLORS = {
  green: "#16a34a",
  blue: "#2563eb",
  orange: "#ea580c",
  red: "#dc2626",
  gray: "#6b7280"
};

export default function InventoryVelocityDashboard() {
  // State for filters
  const [fromDate, setFromDate] = useState(getDate12MonthsAgoString());
  const [toDate, setToDate] = useState(getTodayString());
  const [categoryId, setCategoryId] = useState<string>("all");
  const [velocityFilter, setVelocityFilter] = useState<string>("all");
  const [abcFilter, setAbcFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Categories list
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Response data
  const [data, setData] = useState<InventoryVelocityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<keyof ProductVelocity>("daysInventoryOutstanding");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Selected product for detail drawer
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductVelocity | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch categories
  useEffect(() => {
    productCategoryApi.getAll()
      .then(res => {
        setCategories(res);
      })
      .catch(err => {
        console.error("Error loading categories:", err);
      });
  }, []);

  // Fetch Dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        from: fromDate,
        to: toDate
      };
      if (categoryId !== "all") params.categoryId = categoryId;
      if (velocityFilter !== "all") params.velocity = velocityFilter;
      if (abcFilter !== "all") params.abc = abcFilter;

      const response = await api.get("/dashboard/inventory-velocity", { params });
      const resData = response.data || response; // Axios interceptor returns response.data
      
      if (resData && resData.summary && Array.isArray(resData.products)) {
        setData(resData);
      } else {
        throw new Error("Dữ liệu trả về không đúng định dạng");
      }
    } catch (err: any) {
      console.error("Error fetching velocity dashboard:", err);
      setError(err?.message || "Không thể tải dữ liệu tốc độ luân chuyển hàng tồn kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort products client-side for search queries or clicking headers
  const processedProducts = useMemo(() => {
    if (!data || !data.products) return [];

    let result = [...data.products];

    // Search query
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(
        p => p.productName.toLowerCase().includes(query) ||
             p.productId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle nulls
      if (aVal === null || aVal === undefined) return sortDir === "asc" ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortDir === "asc" ? -1 : 1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Numbers
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [data, search, sortBy, sortDir]);

  // Compute Median DIO and counts
  const calculatedMetrics = useMemo(() => {
    if (!data || !data.products || data.products.length === 0) {
      return { medianDio: 0, slowCount: 0, slowPercentage: 0 };
    }

    const allProducts = data.products;
    const dios = allProducts
      .map(p => p.daysInventoryOutstanding)
      .filter((dio): dio is number => dio !== null)
      .sort((a, b) => a - b);

    let medianDio = 0;
    if (dios.length > 0) {
      const mid = Math.floor(dios.length / 2);
      medianDio = dios.length % 2 !== 0 ? dios[mid] : (dios[mid - 1] + dios[mid]) / 2;
    }

    const slowCount = allProducts.filter(p => p.velocityClass === "SLOW").length;
    const slowPercentage = (slowCount / allProducts.length) * 100;

    return { medianDio, slowCount, slowPercentage };
  }, [data]);

  // Sort columns toggler
  const handleSort = (field: keyof ProductVelocity) => {
    if (sortBy === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // Click row to open detail sheet and load history
  const handleRowClick = async (product: ProductVelocity) => {
    setSelectedProductId(product.productId);
    setSelectedProduct(product);
    setLoadingHistory(true);
    setHistoryData([]);

    try {
      const response = await api.get(`/consumption-history/${product.productId}`);
      const resData = response.data || response;
      if (Array.isArray(resData)) {
        // Sort ascending by date
        const sorted = [...resData].sort((a, b) => a.periodStartDate.localeCompare(b.periodStartDate));
        setHistoryData(sorted);
      }
    } catch (err) {
      console.error("Error loading consumption history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Recharts Pie Chart Data for ABC
  const pieData = useMemo(() => {
    if (!data?.summary?.abcDistribution) return [];
    const dist = data.summary.abcDistribution;
    return [
      { name: "A", value: dist.A || 0, color: COLORS.green, label: "Nhóm A (Quan trọng cao)" },
      { name: "B", value: dist.B || 0, color: COLORS.blue, label: "Nhóm B (Quan trọng trung bình)" },
      { name: "C", value: dist.C || 0, color: COLORS.gray, label: "Nhóm C (Quan trọng thấp)" }
    ].filter(item => item.value > 0);
  }, [data]);

  // Recharts Bar Chart Data for Velocity
  const barData = useMemo(() => {
    if (!data?.summary?.velocityDistribution) return [];
    const dist = data.summary.velocityDistribution;
    return [
      { name: "FAST", count: dist.FAST || 0, fill: COLORS.green },
      { name: "NORMAL", count: dist.NORMAL || 0, fill: COLORS.blue },
      { name: "SLOW", count: dist.SLOW || 0, fill: COLORS.orange }
    ];
  }, [data]);

  // Trend summary totals
  const trendMetrics = useMemo(() => {
    if (!data || !data.products) return { growing: 0, stable: 0, declining: 0 };
    const growing = data.products.filter(p => p.trend === "GROWING").length;
    const stable = data.products.filter(p => p.trend === "STABLE").length;
    const declining = data.products.filter(p => p.trend === "DECLINING").length;
    return { growing, stable, declining };
  }, [data]);

  // Historical Consumption Chart Data formatting
  const drawerChartData = useMemo(() => {
    if (historyData.length === 0) return [];
    return historyData.map(h => ({
      dateLabel: formatDate(h.periodStartDate).substring(3), // Format MM/YYYY
      rawDate: h.periodStartDate,
      consumption: h.actualConsumption,
      planned: h.plannedConsumption
    }));
  }, [historyData]);

  // Limits for the recent vs previous 3 months regions in the Line Chart
  const trendRegions = useMemo(() => {
    const N = drawerChartData.length;
    if (N < 3) return { recent: null, previous: null };

    const recent = {
      start: drawerChartData[N - 3]?.dateLabel,
      end: drawerChartData[N - 1]?.dateLabel
    };

    const previous = N >= 6 ? {
      start: drawerChartData[N - 6]?.dateLabel,
      end: drawerChartData[N - 4]?.dateLabel
    } : null;

    return { recent, previous };
  }, [drawerChartData]);

  return (
    <div className="space-y-6">
      {/* ── Filter Bar Card ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Phân tích Tốc độ Luân chuyển Kho
          </h1>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </Button>
        </div>

        <Card className="border shadow-sm bg-white p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Tìm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-white" />
            </div>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs px-2 border border-slate-200 rounded-md bg-white" />
            <span className="text-slate-300 text-xs">→</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs px-2 border border-slate-200 rounded-md bg-white" />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 text-xs w-36 border-slate-200 bg-white"><SelectValue placeholder="Danh mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.categoryName}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex bg-slate-100 p-0.5 rounded-md">
              {["all", "A", "B", "C"].map((item) => (
                <button key={item} type="button" onClick={() => setAbcFilter(item)} className={`px-2.5 h-7 text-xs font-medium rounded transition-all ${abcFilter === item ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
                  {item === "all" ? "ABC" : item}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-md">
              {[{ v: "all", l: "Tốc độ" }, { v: "FAST", l: "Nhanh" }, { v: "NORMAL", l: "Vừa" }, { v: "SLOW", l: "Chậm" }].map((item) => (
                <button key={item.v} type="button" onClick={() => setVelocityFilter(item.v)} className={`px-2.5 h-7 text-xs font-medium rounded transition-all ${velocityFilter === item.v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
                  {item.l}
                </button>
              ))}
            </div>
            <Button onClick={fetchData} disabled={loading} size="sm" className="h-8 ml-auto bg-primary text-white">Áp dụng</Button>
          </div>
        </Card>
      </div>

      {/* ── Summary Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Tổng sản phẩm phân tích</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {loading ? "..." : data?.summary?.totalProducts ?? 0}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Consumption Value */}
        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Giá trị tiêu thụ</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {loading ? "..." : formatCurrency(data?.summary?.totalConsumptionValue ?? 0)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Khoảng thời gian: {data?.summary?.dataMonths ?? 0} tháng
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Slow Moving Inventory */}
        {(() => {
          const { slowCount, slowPercentage } = calculatedMetrics;
          let variantBg = "bg-slate-50";
          let borderL = "bg-slate-400";
          let textC = "text-slate-600";
          let alertMsg = "Mức độ an toàn";

          if (slowPercentage > 35) {
            variantBg = "bg-rose-50/50";
            borderL = "bg-red-500";
            textC = "text-red-600";
            alertMsg = "Cảnh báo cao (Nhiều hàng tồn chậm)";
          } else if (slowPercentage > 20) {
            variantBg = "bg-amber-50/50";
            borderL = "bg-orange-500";
            textC = "text-orange-600";
            alertMsg = "Cảnh báo trung bình (Tồn kho chậm tăng)";
          } else {
            variantBg = "bg-emerald-50/30";
            borderL = "bg-emerald-500";
            textC = "text-emerald-600";
            alertMsg = "Tỷ lệ hàng chậm ở mức thấp";
          }

          return (
            <Card className={`border shadow-sm overflow-hidden relative group hover:shadow-md transition-all ${variantBg}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${borderL}`} />
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Hàng bán chậm (SLOW)</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                    {loading ? "..." : `${slowCount} / ${data?.products?.length ?? 0}`}
                  </h3>
                  <p className={`text-xs mt-0.5 font-medium ${textC}`}>
                    {loading ? "..." : `${slowPercentage.toFixed(1)}% — ${alertMsg}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Card 4: Median DIO */}
        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Ngày tồn kho trung vị (Median DIO)</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {loading ? "..." : calculatedMetrics.medianDio > 0 ? `${formatNumber(calculatedMetrics.medianDio, 1)} ngày` : "—"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tính trên toàn bộ danh mục hiển thị
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ABC Donut Chart */}
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-bold text-slate-800">
              Phân phối giá trị tiêu thụ (ABC)
            </CardTitle>
            <CardDescription className="text-xs">
              Nhấp vào lát biểu đồ để lọc danh sách sản phẩm nhanh
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[250px]">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Đang tải biểu đồ...</div>
            ) : pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Không có dữ liệu</div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                <div className="w-1/2 min-h-[180px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(entry) => setAbcFilter(abcFilter === entry.name ? "all" : entry.name)}
                        className="cursor-pointer"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={abcFilter === entry.name ? "#0f172a" : "#fff"}
                            strokeWidth={abcFilter === entry.name ? 2.5 : 1}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => [`${val} sản phẩm`, "Số lượng"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {abcFilter !== "all" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400">Đang lọc</span>
                      <span className="text-xl font-extrabold text-slate-700">Nhóm {abcFilter}</span>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {pieData.map((entry, index) => {
                    const total = data?.summary?.totalProducts || 1;
                    const pct = ((entry.value / total) * 100).toFixed(0);
                    const isSelected = abcFilter === entry.name;
                    return (
                      <div
                        key={index}
                        onClick={() => setAbcFilter(isSelected ? "all" : entry.name)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                          isSelected ? "bg-slate-50 border-slate-300 font-bold scale-[1.02]" : "border-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-slate-600">{entry.label}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{entry.value} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Velocity Horizontal Bar Chart */}
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-bold text-slate-800">
              Phân phối Tốc độ lưu chuyển (Velocity)
            </CardTitle>
            <CardDescription className="text-xs">
              Thống kê lượng sản phẩm theo tốc độ lưu chuyển
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex items-center justify-center min-h-[250px]">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <RechartsTooltip formatter={(val) => [`${val} sản phẩm`, "Số lượng"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trend Breakdown Card */}
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-bold text-slate-800">
              Xu hướng Tiêu thụ (Trend Breakdown)
            </CardTitle>
            <CardDescription className="text-xs">
              So sánh tiêu thụ 3 tháng gần nhất với 3 tháng trước đó
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-center min-h-[250px] space-y-4">
            {loading ? (
              <div className="text-slate-400 text-sm text-center">Đang tải xu hướng...</div>
            ) : (
              <>
                {/* Growing */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tăng trưởng (GROWING)</p>
                      <p className="text-xs text-slate-400">Tiêu thụ tăng &gt; 10%</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-600">{trendMetrics.growing} sp</span>
                </div>

                {/* Stable */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/30 border border-blue-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                      <Minus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ổn định (STABLE)</p>
                      <p className="text-xs text-slate-400">Dao động trong khoảng ±10%</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-blue-600">{trendMetrics.stable} sp</span>
                </div>

                {/* Declining */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suy giảm (DECLINING)</p>
                      <p className="text-xs text-slate-400">Tiêu thụ giảm &gt; 10%</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold font-mono text-rose-600">{trendMetrics.declining} sp</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Main Products Table ── */}
      <Card className="border shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Danh sách chi tiết tốc độ luân chuyển
              </CardTitle>
              <CardDescription className="text-xs">
                Mặc định được sắp xếp theo số ngày tồn kho (DIO) tăng dần. Click tiêu đề cột để sắp xếp lại.
              </CardDescription>
            </div>
            {abcFilter !== "all" && (
              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1.5 self-start sm:self-auto">
                Lọc nhóm ABC: {abcFilter}
                <button onClick={() => setAbcFilter("all")} className="font-bold hover:text-red-500 ml-1">×</button>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-slate-500 font-medium">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3 align-middle" />
              Đang tải danh sách tốc độ luân chuyển...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 font-medium flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">Thử lại</Button>
            </div>
          ) : processedProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              Không có dữ liệu tiêu thụ hoặc sản phẩm nào khớp bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 select-none">
                    <th
                      onClick={() => handleSort("productName")}
                      className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-1">Sản phẩm <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                    <th onClick={() => handleSort("velocityClass")} className="text-left py-3 px-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors w-40">
                      <div className="flex items-center gap-1">Phân loại <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                    <th
                      onClick={() => handleSort("avgMonthlyConsumption")}
                      className="text-right py-3 px-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">Tiêu thụ TB/tháng <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                    <th onClick={() => handleSort("daysInventoryOutstanding")} className="text-left py-3 px-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors w-40">
                      <div className="flex items-center gap-1">DIO <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                    <th
                      onClick={() => handleSort("avgInventory")}
                      className="text-right py-3 px-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">Tồn kho TB <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                    <th
                      onClick={() => handleSort("totalConsumptionValue")}
                      className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-1">Giá trị tiêu thụ <ArrowUpDown className="h-3 w-3 text-slate-400" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <TooltipProvider>
                    {processedProducts.map((p) => {
                      const isSlow = p.velocityClass === "SLOW";
                      const isDeclining = p.trend === "DECLINING";
                      const isStable = p.trend === "STABLE";
                      const isFast = p.velocityClass === "FAST";
                      const isAbcA = p.abcClass === "A";

                      // Row highlight style classes
                      let rowBgClass = "hover:bg-slate-50/60";
                      if (isSlow && isDeclining) {
                        rowBgClass = "bg-rose-50/50 hover:bg-rose-50 border-rose-100";
                      } else if (isSlow && isStable) {
                        rowBgClass = "bg-amber-50/30 hover:bg-amber-50 border-amber-100";
                      } else if (isAbcA && isFast) {
                        rowBgClass = "bg-emerald-50/20 hover:bg-emerald-50/30 border-emerald-100/30";
                      }

                      // ABC badge styles
                      let abcBadge = "bg-slate-100 text-slate-700 border-slate-200";
                      if (p.abcClass === "A") abcBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      if (p.abcClass === "B") abcBadge = "bg-blue-50 text-blue-700 border-blue-200";

                      // Velocity Badge
                      let velocityText = "Bình thường";
                      let velocityBadge = "bg-blue-50 text-blue-700 border-blue-100";

                      if (p.velocityClass === "FAST") {
                        velocityText = "Nhanh";
                        velocityBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                      } else if (p.velocityClass === "SLOW") {
                        velocityText = "Chậm";
                        velocityBadge = "bg-orange-50 text-orange-700 border-orange-100";
                      }

                      // Trend rendering
                      let trendNode = <span className="text-slate-500 flex items-center justify-center gap-1 font-mono text-xs"><Minus className="h-3 w-3" /> —</span>;
                      if (p.trend === "GROWING") {
                        trendNode = (
                          <span className="text-emerald-600 flex items-center justify-center gap-1 font-semibold font-mono text-xs">
                            <TrendingUp className="h-3.5 w-3.5" /> +{(p.trendRate * 100).toFixed(1)}%
                          </span>
                        );
                      } else if (p.trend === "DECLINING") {
                        trendNode = (
                          <span className="text-rose-600 flex items-center justify-center gap-1 font-semibold font-mono text-xs">
                            <TrendingDown className="h-3.5 w-3.5" /> {(p.trendRate * 100).toFixed(1)}%
                          </span>
                        );
                      } else if (p.trend === "STABLE") {
                        trendNode = (
                          <span className="text-slate-500 flex items-center justify-center gap-1 font-mono text-xs">
                            <Minus className="h-3.5 w-3.5" /> +{(p.trendRate * 100).toFixed(1)}%
                          </span>
                        );
                      }

                      // Inventory source indicator
                      let sourceIndicator = null;
                      if (p.inventorySource === "STOCK_COUNT") {
                        sourceIndicator = (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-emerald-500 cursor-help inline-flex ml-1.5 align-middle"><CheckCircle className="h-3.5 w-3.5" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Dữ liệu tồn kho từ kiểm kê thực tế</TooltipContent>
                          </Tooltip>
                        );
                      } else if (p.inventorySource === "THEORETICAL") {
                        sourceIndicator = (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-slate-400 cursor-help inline-flex ml-1.5 align-middle"><Info className="h-3.5 w-3.5" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Dữ liệu tồn kho lý thuyết từ kế hoạch EPQ</TooltipContent>
                          </Tooltip>
                        );
                      } else {
                        sourceIndicator = (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-slate-300 cursor-help inline-flex ml-1.5 align-middle"><Minus className="h-3.5 w-3.5" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Không có dữ liệu tồn kho thực tế/lý thuyết</TooltipContent>
                          </Tooltip>
                        );
                      }

                      return (
                        <tr
                          key={p.productId}
                          onClick={() => handleRowClick(p)}
                          className={`border-b cursor-pointer transition-colors ${rowBgClass} ${p.insufficientData ? "opacity-60" : ""}`}
                        >
                          {/* Product Details */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {p.productName}
                              {p.insufficientData && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-amber-500 cursor-help"><AlertCircle className="h-3.5 w-3.5" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent>Dữ liệu tiêu thụ &lt; 3 tháng, kết quả có độ tin cậy thấp</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">
                              ID: {p.productId} · Đơn vị: {p.unit} · {p.categoryName}
                            </div>
                          </td>

                          {/* Classification: ABC + Velocity + Trend gộp 1 ô */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={`${abcBadge} font-bold px-1.5 py-0 text-[11px] rounded shadow-2xs`}>{p.abcClass}</Badge>
                              <Badge variant="outline" className={`${velocityBadge} font-medium px-1.5 py-0 text-[11px] rounded gap-0.5`}>
                                {velocityText}
                              </Badge>
                            </div>
                            <div className="mt-1">{trendNode}</div>
                          </td>

                          {/* Avg Monthly Consumption */}
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatNumber(p.avgMonthlyConsumption, 1)} {p.unit}
                          </td>

                          {/* DIO với thanh trực quan so với median toàn danh mục */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isSlow ? "bg-orange-400" : isFast ? "bg-emerald-400" : "bg-blue-400"}`}
                                  style={{ width: `${Math.min(((p.daysInventoryOutstanding ?? 0) / (calculatedMetrics.medianDio * 2 || 30)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs text-slate-600 w-10 text-right shrink-0">
                                {p.daysInventoryOutstanding != null ? `${formatNumber(p.daysInventoryOutstanding, 1)}d` : "—"}
                              </span>
                            </div>
                          </td>

                          {/* Avg Inventory */}
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            <span>{formatNumber(p.avgInventory, 1)}</span>
                            {sourceIndicator}
                          </td>

                          {/* Total Consumption Value */}
                          <td className="py-3 px-4 text-right font-mono text-slate-800 font-semibold">
                            {formatCurrency(p.totalConsumptionValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </TooltipProvider>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Drawer (radix Sheet) ── */}
      <Sheet open={selectedProductId !== null} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-slate-50/95 backdrop-blur-md border-l">
          {selectedProduct && (
            <div className="space-y-6">
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <SheetTitle className="text-xl font-extrabold text-slate-800">
                      {selectedProduct.productName}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-slate-400 font-mono">
                      ID: {selectedProduct.productId} · {selectedProduct.categoryName}
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={
                      selectedProduct.abcClass === "A"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedProduct.abcClass === "B"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }>
                      Nhóm {selectedProduct.abcClass}
                    </Badge>
                    <Badge variant="outline" className={
                      selectedProduct.velocityClass === "FAST"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : selectedProduct.velocityClass === "SLOW"
                        ? "bg-orange-50 text-orange-700 border-orange-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }>
                      {selectedProduct.velocityClass === "FAST" ? "🚀 Nhanh" : selectedProduct.velocityClass === "SLOW" ? "🐢 Chậm" : "➡ Vừa"}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              {/* 12-Month Consumption History Line Chart */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Lịch sử tiêu thụ 12 tháng gần nhất</h4>
                <Card className="border shadow-2xs bg-white p-4">
                  {loadingHistory ? (
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-xs">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
                      Đang tải lịch sử tiêu thụ...
                    </div>
                  ) : drawerChartData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-xs">
                      Không tìm thấy lịch sử tiêu thụ thực tế của sản phẩm
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-end items-center gap-4 mb-2 text-[10px] text-slate-400 select-none">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2 bg-slate-100 border border-slate-300" />
                          <span>3T Trước liền kề</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2 bg-blue-50 border border-blue-200" />
                          <span>3T Gần nhất</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-0.5 border-t border-red-500 border-dashed" />
                          <span>Tiêu thụ TB ({formatNumber(selectedProduct.avgMonthlyConsumption, 1)})</span>
                        </div>
                      </div>

                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={drawerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <RechartsTooltip formatter={(val) => [`${val} ${selectedProduct.unit}`, "Số lượng"]} />
                          
                          {/* Reference Area for Trend Calculations */}
                          {trendRegions.previous && (
                            <ReferenceArea
                              x1={trendRegions.previous.start}
                              x2={trendRegions.previous.end}
                              fill="#f1f5f9"
                              fillOpacity={0.65}
                            />
                          )}
                          {trendRegions.recent && (
                            <ReferenceArea
                              x1={trendRegions.recent.start}
                              x2={trendRegions.recent.end}
                              fill="#eff6ff"
                              fillOpacity={0.65}
                            />
                          )}

                          {/* Reference line for monthly average consumption */}
                          <ReferenceLine
                            y={selectedProduct.avgMonthlyConsumption}
                            stroke="#ef4444"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                          />

                          <Line
                            type="monotone"
                            dataKey="consumption"
                            stroke={COLORS.blue}
                            strokeWidth={2}
                            name="Tiêu thụ thực tế"
                            dot={{ stroke: COLORS.blue, strokeWidth: 1, r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>

              {/* KPI indicators breakdown */}
              <div className="grid grid-cols-2 gap-2.5">
                <Card className="border shadow-2xs bg-white p-3">
                  <span className="text-xs text-slate-400 block">Xu hướng tiêu thụ (3T gần vs 3T trước)</span>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedProduct.trend === "GROWING" ? (
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></span>
                    ) : selectedProduct.trend === "DECLINING" ? (
                      <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown className="h-5 w-5" /></span>
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center"><Minus className="h-5 w-5" /></span>
                    )}
                    <div>
                      <span className="font-bold text-slate-800 block text-sm">
                        {selectedProduct.trend === "GROWING" ? "Tăng trưởng" : selectedProduct.trend === "DECLINING" ? "Suy giảm" : "Ổn định"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {selectedProduct.recentAvgConsumption.toFixed(1)} vs {selectedProduct.previousAvgConsumption.toFixed(1)} ({selectedProduct.trendRate >= 0 ? "+" : ""}{(selectedProduct.trendRate * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border shadow-2xs bg-white p-4">
                  <span className="text-xs text-slate-400 block">Ngày lưu kho nổi bật (DIO)</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Calendar className="h-5 w-5" /></span>
                    <div>
                      <span className="font-extrabold text-slate-800 text-base block font-mono">
                        {selectedProduct.daysInventoryOutstanding != null ? `${selectedProduct.daysInventoryOutstanding.toFixed(1)} ngày` : "—"}
                      </span>
                      <span className="text-xs text-slate-400">
                        Hệ số vòng quay: {selectedProduct.turnoverRatio != null ? `${selectedProduct.turnoverRatio.toFixed(1)}× / năm` : "—"}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border shadow-2xs bg-white p-4">
                  <span className="text-xs text-slate-400 block">Tồn kho trung bình trong kỳ</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center"><Package className="h-5 w-5" /></span>
                    <div>
                      <span className="font-bold text-slate-800 block text-sm font-mono">
                        {formatNumber(selectedProduct.avgInventory, 1)} {selectedProduct.unit}
                      </span>
                      <span className="text-xs text-slate-400 font-medium block">
                        Nguồn: {
                          selectedProduct.inventorySource === "STOCK_COUNT" ? "Kiểm kê thực tế" :
                          selectedProduct.inventorySource === "THEORETICAL" ? "Lý thuyết từ EPQ" : "Chưa có dữ liệu"
                        }
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border shadow-2xs bg-white p-4">
                  <span className="text-xs text-slate-400 block">Tổng doanh số tiêu thụ trong kỳ</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="h-5 w-5" /></span>
                    <div>
                      <span className="font-extrabold text-slate-800 text-sm block font-mono">
                        {formatCurrency(selectedProduct.totalConsumptionValue)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Lượng: {formatNumber(selectedProduct.totalConsumption, 1)} {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Extra warnings / action recommendations */}
                            {selectedProduct.velocityClass === "SLOW" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-orange-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-orange-500" />
                  <span>
                    <strong>Luân chuyển chậm</strong> ({selectedProduct.daysInventoryOutstanding?.toFixed(1)} ngày tồn) —{" "}
                    {selectedProduct.trend === "DECLINING" ? "cân nhắc giảm đơn đặt / giải phóng tồn." : "nên tối ưu mức tồn kho an toàn."}
                  </span>
                </div>
              )}

              {selectedProduct.abcClass === "A" && selectedProduct.velocityClass === "FAST" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm">Sản phẩm cốt lõi luân chuyển nhanh</h5>
                    <p className="text-xs mt-1 text-emerald-700">
                      Sản phẩm đóng góp giá trị tiêu thụ lớn hàng đầu (Nhóm A) và có tốc độ bán rất nhanh. 
                      Cần luôn bảo đảm nguồn cung đầy đủ và theo dõi chặt chẽ độ biến động Lead time của nhà cung cấp để tránh cạn kho.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProductId(null)}
                  className="rounded-lg text-sm"
                >
                  Đóng lại
                </Button>
                <Button
                  onClick={() => {
                    setSelectedProductId(null);
                    // Open plan logic
                    window.location.hash = `#/new-plan?productId=${selectedProduct.productId}&mode=replan`;
                    // If using react-router-dom navigate is better, but since we are inside drawer, redirecting or calling parent navigate works.
                    // Let's redirect standardly by path.
                    window.location.pathname = `/new-plan`;
                    // Wait, let's just use navigate if possible, or since we're in the same SPA, redirect to `/new-plan?productId={id}` is great.
                  }}
                  className="bg-primary text-white hover:bg-primary/95 rounded-lg text-sm gap-1.5"
                >
                  Điều chỉnh kế hoạch <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
