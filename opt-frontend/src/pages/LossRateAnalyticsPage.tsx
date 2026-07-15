import { useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProductSelector from "@/components/product/ProductSelector";
import KpiCard from "@/components/common/KpiCard";
import { analyticsApi } from "@/api/analyticsApi";
import { cn } from "@/lib/utils";
import type { LossRateAnalysis } from "@/types/inventory-opt/Analytics";

export default function LossRateAnalyticsPage() {
  const [productId, setProductId] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  const [analysis, setAnalysis] = useState<LossRateAnalysis | null>(null);
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

    const fromDateValue = format(fromDate, "yyyy-MM-dd");
    const toDateValue = format(toDate, "yyyy-MM-dd");

    try {
      setLoading(true);
      const result = await analyticsApi.getLossRateAnalysis(
        productId,
        fromDateValue,
        toDateValue,
      );
      setAnalysis(result);
      if (result.stockCountsUsed === 0) {
        toast.info("Không có dữ liệu kiểm kê trong khoảng thời gian này");
      }
    } catch (error: any) {
      toast.error("Lỗi phân tích", {
        description: error?.message || "Không thể tải dữ liệu phân tích",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Phân tích tỷ lệ thất thoát
        </h1>
        <p className="mt-2 text-gray-600">
          Phân tích hao hụt, mất mát hàng từ dữ liệu kiểm kê để tối ưu hóa quản
          lý kho
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-gray-400",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    disabled={(d) => d > new Date()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-gray-400",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    disabled={(d) =>
                      (fromDate ? d < fromDate : false) || d > new Date()
                    }
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
              title="Tỷ lệ thất thoát TB"
              value={`${(analysis.avgLossRate * 100).toFixed(2)}%`}
              icon={TrendingDown}
              variant={analysis.avgLossRate > 0.05 ? "danger" : "warning"}
            />
            <KpiCard
              title="Tổng giá trị thất thoát"
              value={`${analysis.totalLossValue.toLocaleString("vi-VN")} VND`}
              icon={DollarSign}
              variant={analysis.totalLossValue < 0 ? "danger" : "warning"}
            />
            <KpiCard
              title="Phiếu kiểm kê"
              value={analysis.stockCountsUsed}
              icon={AlertTriangle}
              variant="info"
            />
            <KpiCard
              title="Cấu hình phế liệu"
              value={`${(analysis.configuredSpoilageRate * 100).toFixed(2)}%`}
              icon={TrendingDown}
              variant="info"
            />
          </div>

          {/* Messages & Alerts */}
          <Card
            className={
              analysis.exceedsWarningThreshold ? "border-red-300 bg-red-50" : ""
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {analysis.exceedsWarningThreshold && (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                Kết luận
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{analysis.message}</p>

              {analysis.suggestUpdateSpoilageRate && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Đề xuất:</strong> Hệ số phế liệu hiện tại (
                    {(analysis.configuredSpoilageRate * 100).toFixed(2)}%) khác
                    biệt đáng kể với dữ liệu thực tế. Cân nhắc cập nhật thành{" "}
                    {(analysis.avgLossRate * 100).toFixed(2)}%.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Table */}
          {analysis.details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết từng phiếu kiểm kê</CardTitle>
                <CardDescription>
                  {analysis.details.length} phiếu trong khoảng thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày kiểm kê</TableHead>
                        <TableHead className="text-right">
                          SL hệ thống
                        </TableHead>
                        <TableHead className="text-right">SL thực tế</TableHead>
                        <TableHead className="text-right">Chênh lệch</TableHead>
                        <TableHead className="text-right">Tỷ lệ %</TableHead>
                        <TableHead className="text-right">
                          Giá trị (VND)
                        </TableHead>
                        <TableHead>Cảnh báo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.details.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell>{detail.countDate}</TableCell>
                          <TableCell className="text-right font-mono">
                            {detail.systemQuantity.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {detail.actualQuantity.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span
                              className={
                                detail.varianceQty < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {detail.varianceQty > 0 ? "+" : ""}
                              {detail.varianceQty.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(detail.varianceRate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {detail.varianceValue.toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            {detail.lossWarning && (
                              <Badge variant="destructive">Cảnh báo</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Chọn sản phẩm và khoảng thời gian để xem phân tích tỷ lệ thất
                thoát
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
