import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ForecastChart from "@/components/forecast/ForecastChart";
import ProductSelector from "@/components/product/ProductSelector";
import { Card } from "@/components/ui/card";
import type { Product } from "@/types/inventory-opt/product";
import type { ConsumptionHistory } from "@/types/inventory-opt/consumption-history";
import api from "@/api/axiosConfig";
import { completeForecastDataFromBackend } from "@/utils/forecastCompletion";
import { getDataQualityMessage } from "@/types/forecast";
import type {
  ConsumptionRecord,
  ForecastResult,
  ConsumptionPoint,
} from "@/types/forecast";
import type { ForecastSuggestionResponse } from "../types/inventory-opt/forecast-suggestion";
import type { ForecastModel, ForecastPoint } from "@/types/forecast";
import { cn } from "@/lib/utils";

export default function ForecastPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [consumptionHistory, setConsumptionHistory] = useState<
    ConsumptionHistory[]
  >([]);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/products/all")
      .then((response) => setProducts(response.data))
      .catch((error) => {
        console.error("Error fetching products:", error);
        setError("Lỗi khi tải danh sách mặt hàng");
      });
  }, []);

  const [selectedProduct, setSelectedProduct] = useState<string | "">("1");
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(
    null,
  );

  const handleProductSelect = (id: string) => {
    setSelectedProduct(id);
    setSelectedYear(currentYear);
    setForecastResult(null);
    setConsumptionHistory([]);
    setError(null);
  };

  useEffect(() => {
    if (!selectedProduct || !selectedYear) {
      setForecastResult(null);
      return;
    }

    const productId = selectedProduct;
    const product = products.find((p) => p.id === productId);
    if (!product) {
      setError("Không tìm thấy mặt hàng");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setForecastResult(null);

      try {
        console.log(
          `🔄 Fetching consumption history for product ${productId}, year ${selectedYear}`,
        );

        // 🔥 Lấy history theo năm
        const historyRes = await api.get(
          `/consumption-history/${productId}/year/${selectedYear}`,
        );

        const consumptionRecords: ConsumptionHistory[] =
          historyRes.data.data || historyRes.data;

        if (!Array.isArray(consumptionRecords)) {
          throw new Error("API trả về dữ liệu không hợp lệ");
        }

        console.log(
          `✅ History fetched:`,
          consumptionRecords.length,
          "records",
        );
        setConsumptionHistory(consumptionRecords);

        // ❗ CHỈ gọi forecast cho năm hiện tại
        if (selectedYear === currentYear) {
          console.log(`📊 Current year detected, fetching forecast...`);

          try {
            const suggestionRes = await api.get(
              `/inventory/suggest/${productId}`,
            );

            console.log(`✅ Suggestion API response:`, suggestionRes.data);

            const suggestion: ForecastSuggestionResponse = suggestionRes.data;

            const recordsForForecast: ConsumptionRecord[] =
              consumptionRecords.map((item) => ({
                productId: item.productId,
                periodStartDate: item.periodStartDate,
                periodEndDate: item.periodEndDate,
                actualConsumption: Number(item.actualConsumption),
                plannedConsumption: Number(item.plannedConsumption ?? 0),
                actualLeadTimeDays: Number(item.actualLeadTimeDays ?? 0),
                actualSupplyRate: Number(item.actualSupplyRate ?? 0),
                notes: item.notes ?? "",
              }));

            const result = completeForecastDataFromBackend(
              suggestion,
              recordsForForecast,
              {
                id: product.id,
                name: product.productName,
                unit: product.unit,
              },
            );

            console.log(`✅ Forecast result:`, result);
            setForecastResult(result);
          } catch (suggestionErr) {
            console.error("❌ Error fetching suggestion:", suggestionErr);
            setError(
              `Lỗi khi tính dự đoán: ${
                suggestionErr instanceof Error
                  ? suggestionErr.message
                  : "Unknown error"
              }`,
            );
            setForecastResult(null);
          }
        } else {
          console.log(`📅 Past year selected, showing historical data only`);

          const recordsForForecast = consumptionRecords.map((item) => ({
            productId: item.productId,
            periodStartDate: item.periodStartDate,
            periodEndDate: item.periodEndDate,
            actualConsumption: Number(item.actualConsumption),
            plannedConsumption: Number(item.plannedConsumption ?? 0),
            actualLeadTimeDays: Number(item.actualLeadTimeDays ?? 0),
            actualSupplyRate: Number(item.actualSupplyRate ?? 0),
            notes: item.notes ?? "",
          }));

          const historicalResult: ForecastResult = {
            productId: productId,
            productName: product.productName,
            model: "HISTORICAL_DATA_ONLY",
            mape: 0,
            dataPointsUsed: recordsForForecast.length,
            forecastQ: 0,
            previousQ: 0,
            avg6Q: 0,
            unit: product.unit,
            points: [],
            historicalPoints: recordsForForecast.map((record) => ({
              period: record.periodStartDate,
              forecastValue: null,
              actual: record.actualConsumption,
              planned: record.plannedConsumption,
              upperBound: null,
              lowerBound: null,
            })),
            seasonalityInsight: null,
            peakMonth: null,
            lowMonth: null,
          };

          setForecastResult(historicalResult);
        }
      } catch (err) {
        console.error("❌ Error in fetchData:", err);
        setError(
          `Lỗi khi tải dữ liệu: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        );
        setForecastResult(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProduct, selectedYear, products]);

  const handleUseForecast = (q: number) => {
    navigate("/new-plan");
  };

  const handleManualInput = () => {
    navigate("/new-plan");
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-5 space-y-4">
        <h2 className="text-xl font-semibold font-display text-gray-900">
          Chọn mặt hàng để xem dự đoán
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="max-w-sm space-y-2 flex-1">
            <Label>Mặt hàng</Label>
            <ProductSelector
              mode="combobox"
              value={selectedProduct}
              onChange={handleProductSelect}
            />
          </div>

          <div className="max-w-sm space-y-2 flex-1">
            <Label>Năm</Label>
            <Select
              value={selectedYear?.toString() || ""}
              onValueChange={(v) => setSelectedYear(Number(v))}
              disabled={!selectedProduct}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn năm..." />
              </SelectTrigger>
              <SelectContent>
                {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y} {y === currentYear ? "(Hiện tại)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading && (
        <Card className="p-5">
          <p className="text-gray-400 font-body">Đang tải dữ liệu...</p>
        </Card>
      )}

      {/* Forecast Chart */}
      {!loading && forecastResult && (
        <ForecastChart
          result={forecastResult}
          onUseForecast={handleUseForecast}
          onManualInput={handleManualInput}
        />
      )}

      {!loading &&
        !forecastResult &&
        selectedProduct &&
        selectedYear &&
        !error && (
          <Card className="p-5">
            <p className="text-gray-400 font-body text-sm">
              Không có dữ liệu để hiển thị. Hãy kiểm tra dữ liệu tiêu thụ đã
              import.
            </p>
          </Card>
        )}
    </div>
  );
}
