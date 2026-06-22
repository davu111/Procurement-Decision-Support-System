import { useState, useEffect } from "react";
import { TrendingUp, Clock, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductSelector from "@/components/product/ProductSelector";
import KpiCard from "@/components/common/KpiCard";
import { analyticsApi } from "@/api/analyticsApi";
import type { ServiceLevelAnalysis } from "@/types/inventory-opt/Analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function ServiceLevelAnalyticsPage() {
  const [productId, setProductId] = useState("");
  const [fromDate, setFromDate] = useState(getDateMonthAgo());
  const [toDate, setToDate] = useState(getTodayString());

  const [analysis, setAnalysis] = useState<ServiceLevelAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!productId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }

    if (!fromDate || !toDate) {
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }

    try {
      setLoading(true);
      const result = await analyticsApi.getServiceLevelAnalysis(
        productId,
        fromDate,
        toDate,
      );
      setAnalysis(result);
      if (result.totalCycles === 0) {
        toast.info("Không có lịch đặt hàng trong khoảng thời gian này");
      }
    } catch (error: any) {
      toast.error("Lỗi phân tích", {
        description: error?.message || "Không thể tải dữ liệu phân tích",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const slTrendData = analysis
    ? [
        {
          name: "SL",
          value: analysis.serviceLevel * 100,
          target: 95,
        },
      ]
    : [];

  const metricsData = analysis
    ? [
        {
          name: "Stk Out",
          value: analysis.avgStockoutDuration,
        },
        {
          name: "Delivery",
          value: analysis.avgDeliveryDelay,
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Phân tích Service Level
        </h1>
        <p className="mt-2 text-gray-600">
          Đánh giá mức dịch vụ, tỷ lệ cạn hàng, và độ trễ giao hàng
        </p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Điều kiện phân tích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Product Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sản phẩm</label>
              <ProductSelector
                value={productId}
                onChange={setProductId}
                placeholder="Chọn sản phẩm..."
              />
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Analyze Button */}
            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={!productId || loading}
                className="w-full gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Đang phân tích..." : "Phân tích"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              title="Service Level"
              value={`${(analysis.serviceLevel * 100).toFixed(1)}%`}
              icon={TrendingUp}
              variant={analysis.serviceLevel >= 0.95 ? "success" : "danger"}
            />
            <KpiCard
              title="Tỷ lệ cạn hàng"
              value={`${(analysis.stockoutFrequency * 100).toFixed(1)}%`}
              icon={Clock}
              variant={
                analysis.stockoutFrequency < 0.05 ? "success" : "warning"
              }
            />
            <KpiCard
              title="Độ trễ giao hàng TB"
              value={`${analysis.avgDeliveryDelay.toFixed(1)} ngày`}
              icon={Truck}
              variant={analysis.avgDeliveryDelay < 2 ? "success" : "warning"}
            />
            <KpiCard
              title="Ngày cạn hàng TB"
              value={`${analysis.avgStockoutDuration.toFixed(1)} ngày`}
              icon={Clock}
              variant={
                analysis.avgStockoutDuration === 0 ? "success" : "danger"
              }
            />
          </div>

          {/* Status Card */}
          <Card
            className={
              analysis.serviceLevel >= 0.95
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {analysis.serviceLevel >= 0.95 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-red-600" />
                )}
                Đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-700">
                <strong>Service Level:</strong>{" "}
                {(analysis.serviceLevel * 100).toFixed(1)}%
                {analysis.serviceLevel >= 0.95 ? (
                  <span className="ml-2 text-green-600">
                    ✓ Đạt mục tiêu (≥95%)
                  </span>
                ) : (
                  <span className="ml-2 text-red-600">✗ Chưa đạt mục tiêu</span>
                )}
              </p>
              <p className="text-gray-700">
                <strong>Tổng chu kỳ:</strong> {analysis.totalCycles} chu kỳ
                {analysis.cyclesWithActualDelivery > 0 && (
                  <span className="ml-2 text-gray-600">
                    ({analysis.cyclesWithActualDelivery} có dữ liệu giao hàng
                    thực tế)
                  </span>
                )}
              </p>
              <p className="text-gray-700">
                <strong>Cạn hàng:</strong> {analysis.totalStockoutDays} ngày
                trong{" "}
                {Math.round(
                  (new Date(analysis.toDate).getTime() -
                    new Date(analysis.fromDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                ngày ({(analysis.stockoutFrequency * 100).toFixed(1)}% chu kỳ)
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          {slTrendData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Level Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Level</CardTitle>
                  <CardDescription>So sánh với mục tiêu 95%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={slTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      <Legend />
                      <Bar dataKey="value" fill="#6366F1" name="Actual" />
                      <Bar dataKey="target" fill="#10B981" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Metrics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Thời gian trung bình</CardTitle>
                  <CardDescription>Cạn hàng vs Độ trễ giao</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: "Ngày",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value) => `${value.toFixed(2)} ngày`}
                      />
                      <Bar dataKey="value" fill="#F59E0B" name="Ngày" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Tổng chu kỳ</p>
                  <p className="text-2xl font-bold">{analysis.totalCycles}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Chu kỳ cạn hàng</p>
                  <p className="text-2xl font-bold text-red-600">
                    {Math.round(
                      analysis.totalCycles * analysis.stockoutFrequency,
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Tổng ngày cạn</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analysis.totalStockoutDays}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Tổng ngày trễ</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analysis.totalDelayDays}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Cập nhật giao hàng</p>
                  <p className="text-2xl font-bold">
                    {analysis.cyclesWithActualDelivery}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Chọn sản phẩm và khoảng thời gian để xem phân tích Service Level
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getDateMonthAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split("T")[0];
}
