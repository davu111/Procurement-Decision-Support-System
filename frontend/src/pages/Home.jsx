import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Truck,
  FileText,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Warehouse,
  Package,
  Activity,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  kpiData,
  planStatistics,
  monthlyPlanStatistics,
  warehouseList,
  planTypes,
  planDataByWarehouse,
  planDataByType,
  recentActivities,
} from "@/data/mockDashboardData";
import Header from "../components/all/Header";

const COLORS = {
  completed: "#10b981", // green
  inProgress: "#3b82f6", // blue
  pending: "#f59e0b", // yellow
};

function Home() {
  const [filterPeriod, setFilterPeriod] = useState("day"); // day, month
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterPlanType, setFilterPlanType] = useState("all");
  const [chartType, setChartType] = useState("bar"); // bar, pie

  // Get filtered data
  const filteredChartData = useMemo(() => {
    if (filterPeriod === "day") {
      return planStatistics;
    } else {
      return monthlyPlanStatistics;
    }
  }, [filterPeriod]);

  // Calculate total stats with filters
  const getFilteredStats = () => {
    let completed = 0,
      inProgress = 0,
      pending = 0;

    if (filterWarehouse === "all") {
      Object.values(planDataByWarehouse).forEach((data) => {
        completed += data.completed;
        inProgress += data.inProgress;
        pending += data.pending;
      });
    } else {
      const warehouse = planDataByWarehouse[filterWarehouse];
      if (warehouse) {
        completed = warehouse.completed;
        inProgress = warehouse.inProgress;
        pending = warehouse.pending;
      }
    }

    if (filterPlanType !== "all") {
      const typeData = planDataByType[filterPlanType];
      if (typeData) {
        completed = typeData.completed;
        inProgress = typeData.inProgress;
        pending = typeData.pending;
      }
    }

    return { completed, inProgress, pending };
  };

  const filteredStats = getFilteredStats();

  const summaryData = [
    {
      value: filteredStats.completed,
      label: "Hoàn thành",
      color: COLORS.completed,
    },
    {
      value: filteredStats.inProgress,
      label: "Đang thực hiện",
      color: COLORS.inProgress,
    },
    {
      value: filteredStats.pending,
      label: "Chưa thực hiện",
      color: COLORS.pending,
    },
  ];

  const pieData = [
    { name: "Hoàn thành", value: filteredStats.completed },
    { name: "Đang thực hiện", value: filteredStats.inProgress },
    { name: "Chưa thực hiện", value: filteredStats.pending },
  ];

  const getActivityIcon = (iconName) => {
    const icons = {
      CheckCircle: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      Plus: <FileText className="h-5 w-5 text-blue-500" />,
      Truck: <Truck className="h-5 w-5 text-orange-500" />,
      Play: <TrendingUp className="h-5 w-5 text-purple-500" />,
      LogOut: <ArrowUp className="h-5 w-5 text-red-500" />,
    };
    return icons[iconName] || <Activity className="h-5 w-5 text-gray-500" />;
  };

  return (
    <>
      <Header currentPage="Trang chủ" menu="admin" />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* People in warehouse */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Người trong kho
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {kpiData.totalPeopleInWarehouse}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicles in warehouse */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Xe trong kho
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {kpiData.totalVehiclesInWarehouse}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <Truck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plans today */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Kế hoạch hôm nay
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {kpiData.totalPlansToday}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed plans */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Đã hoàn thành
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {kpiData.completedPlans}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Thời gian
                  </label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Ngày</SelectItem>
                      <SelectItem value="month">Tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Warehouse Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Warehouse className="inline h-4 w-4 mr-2" />
                    Kho hàng
                  </label>
                  <Select
                    value={filterWarehouse}
                    onValueChange={setFilterWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả kho</SelectItem>
                      {warehouseList.map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={warehouse.id.toString()}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plan Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="inline h-4 w-4 mr-2" />
                    Loại kế hoạch
                  </label>
                  <Select
                    value={filterPlanType}
                    onValueChange={setFilterPlanType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại</SelectItem>
                      {planTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Thống kê kế hoạch</CardTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChartType("bar")}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          chartType === "bar"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Cột
                      </button>
                      <button
                        onClick={() => setChartType("pie")}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          chartType === "pie"
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Tròn
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    {chartType === "bar" ? (
                      <BarChart data={filteredChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={filterPeriod === "day" ? "date" : "month"}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="completed"
                          stackId="a"
                          fill={COLORS.completed}
                          name="Hoàn thành"
                        />
                        <Bar
                          dataKey="inProgress"
                          stackId="a"
                          fill={COLORS.inProgress}
                          name="Đang thực hiện"
                        />
                        <Bar
                          dataKey="pending"
                          stackId="a"
                          fill={COLORS.pending}
                          name="Chưa thực hiện"
                        />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? COLORS.completed
                                  : index === 1
                                  ? COLORS.inProgress
                                  : COLORS.pending
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tóm tắt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summaryData.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Tổng cộng
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {filteredStats.completed +
                          filteredStats.inProgress +
                          filteredStats.pending}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="shrink-0">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default Home;
