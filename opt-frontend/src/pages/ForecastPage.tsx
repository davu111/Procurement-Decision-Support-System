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
import { Badge } from "@/components/ui/badge";
import FileImporter from "@/components/forecast/FileImporter";
import ForecastChart from "@/components/forecast/ForecastChart";
import type { Product } from "@/types/inventory-opt/product";
import type { ConsumptionHistory } from "@/types/inventory-opt/consumption-history";
import api from "@/api/axiosConfig";
import { completeForecastDataFromBackend } from "@/utils/forecastCompletion";
import { getDataQualityMessage } from "@/types/forecast";
import type { ConsumptionRecord, ForecastResult } from "@/types/forecast";
import type { ForecastSuggestionResponse } from "../types/inventory-opt/forecast-suggestion";
import { cn } from "@/lib/utils";

export default function ForecastPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [consumptionHistory, setConsumptionHistory] = useState<
    ConsumptionHistory[]
  >([]);

  useEffect(() => {
    api
      .get("/inventory-products")
      .then((response) => setProducts(response.data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);
  const [importedRecords, setImportedRecords] = useState<ConsumptionRecord[]>(
    [],
  );

  const [selectedProduct, setSelectedProduct] = useState<string | "">("");
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(
    null,
  );

  const handleImportSuccess = (records: ConsumptionRecord[]) => {
    setImportedRecords((prev) => [...prev, ...records]);
  };

  // Get products with data count
  // const productDataCounts = mockProducts.map((p) => {
  //   const count = importedRecords.filter(
  //     (r) => r.productCode === p.code,
  //   ).length;
  //   return { ...p, dataCount: count };
  // });

  const handleProductSelect = async (id: string) => {
    const productId = Number(id);
    setSelectedProduct(id);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      // Gọi backend API để lấy gợi ý forecast
      // axios interceptor return ApiResponse<T>, nên cần .data để unwrap
      const suggestionResponse = await api.get<any>(
        `/inventory/suggest/${productId}`,
      );
      const suggestion: ForecastSuggestionResponse = suggestionResponse.data;

      // Gọi consumption history để frontend có chi tiết
      const historyResponse = await api.get<any>(
        `/consumption-history/${productId}`,
      );
      const consumptionRecords: ConsumptionRecord[] = historyResponse.data;

      if (!consumptionRecords || consumptionRecords.length < 3) {
        setForecastResult(null);
        return;
      }

      // Complete dữ liệu từ backend response + history
      const result = completeForecastDataFromBackend(
        suggestion,
        consumptionRecords,
        {
          id: product.id,
          name: product.name,
          unit: product.unit,
        },
      );
      console.log("Completed forecast result for frontend:", result);

      setForecastResult(result);
    } catch (error) {
      console.error("Error fetching forecast suggestion:", error);
      setForecastResult(null);
    }
  };

  const handleUseForecast = (q: number) => {
    // Navigate to new plan page (in real app, would pass data)
    navigate("/new-plan");
  };

  const handleManualInput = () => {
    navigate("/new-plan");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import & Dự đoán</h1>
        <p className="text-muted-foreground mt-1">
          Import dữ liệu tiêu thụ lịch sử, hệ thống tự động chọn mô hình và đưa
          ra dự đoán
        </p>
      </div>

      {/* Step 1: Import */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 1: Import dữ liệu tiêu thụ
        </h2>
        <FileImporter onImportSuccess={handleImportSuccess} />

        {importedRecords.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{importedRecords.length} bản ghi</Badge>
            đã có trong hệ thống
          </div>
        )}
      </div>

      {/* Step 2: Select product & view forecast */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">
          Bước 2: Chọn mặt hàng để xem dự đoán
        </h2>

        <div className="max-w-sm space-y-2">
          <Label>Mặt hàng</Label>
          <Select value={selectedProduct} onValueChange={handleProductSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn mặt hàng..." />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => {
                return (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2">
                      <span>
                        {p.code} - {p.name}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Data quality badges */}
        {/* {selectedProduct && (
          <div className="flex flex-wrap gap-2">
            {productDataCounts
              .filter((p) => p.code === selectedProduct)
              .map((p) => {
                const quality = getDataQualityMessage(p.dataCount);
                const model = getModelForDataPoints(p.dataCount);
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span>{quality.icon}</span>
                    <span className="text-muted-foreground">
                      {quality.message}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {model}
                    </Badge>
                  </div>
                );
              })}
          </div>
        )} */}
      </div>

      {/* Forecast Chart */}
      {forecastResult && (
        <ForecastChart
          result={forecastResult}
          onUseForecast={handleUseForecast}
          onManualInput={handleManualInput}
        />
      )}
    </div>
  );
}
