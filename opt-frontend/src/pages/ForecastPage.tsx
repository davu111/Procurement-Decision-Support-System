import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import FileImporter from '@/components/forecast/FileImporter';
import ForecastChart from '@/components/forecast/ForecastChart';
import { mockProducts, mockConsumptionHistory } from '@/data/mockData';
import { generateForecast } from '@/utils/forecastEngine';
import { getModelForDataPoints, getDataQualityMessage } from '@/types/forecast';
import type { ConsumptionRecord, ForecastResult } from '@/types/forecast';
import { cn } from '@/lib/utils';

export default function ForecastPage() {
  const navigate = useNavigate();
  const [importedRecords, setImportedRecords] = useState<ConsumptionRecord[]>(() => {
    // Pre-load from existing mock consumption history
    return mockConsumptionHistory.map(h => {
      const product = mockProducts.find(p => p.id === h.productId);
      return {
        productCode: product?.code || '',
        periodStartDate: h.periodStartDate,
        periodEndDate: h.periodEndDate,
        actualConsumption: h.actualConsumption,
        plannedConsumption: h.plannedConsumption,
        actualLeadTimeDays: h.actualLeadTimeDays || 30,
        actualSupplyRate: h.actualSupplyRate || null,
        notes: h.notes,
      };
    });
  });

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  const handleImportSuccess = (records: ConsumptionRecord[]) => {
    setImportedRecords(prev => [...prev, ...records]);
  };

  // Get products with data count
  const productDataCounts = mockProducts.map(p => {
    const count = importedRecords.filter(r => r.productCode === p.code).length;
    return { ...p, dataCount: count };
  });

  const handleProductSelect = (code: string) => {
    setSelectedProduct(code);
    const product = mockProducts.find(p => p.code === code);
    if (!product) return;
    const productRecords = importedRecords.filter(r => r.productCode === code);
    if (productRecords.length < 3) {
      setForecastResult(null);
      return;
    }
    const result = generateForecast(productRecords, code, product.name, product.unit);
    setForecastResult(result);
  };

  const handleUseForecast = (q: number) => {
    // Navigate to new plan page (in real app, would pass data)
    navigate('/new-plan');
  };

  const handleManualInput = () => {
    navigate('/new-plan');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import & Dự đoán</h1>
        <p className="text-muted-foreground mt-1">
          Import dữ liệu tiêu thụ lịch sử, hệ thống tự động chọn mô hình và đưa ra dự đoán
        </p>
      </div>

      {/* Step 1: Import */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Bước 1: Import dữ liệu tiêu thụ</h2>
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
        <h2 className="font-semibold text-foreground">Bước 2: Chọn mặt hàng để xem dự đoán</h2>

        <div className="max-w-sm space-y-2">
          <Label>Mặt hàng</Label>
          <Select value={selectedProduct} onValueChange={handleProductSelect}>
            <SelectTrigger><SelectValue placeholder="Chọn mặt hàng..." /></SelectTrigger>
            <SelectContent>
              {productDataCounts.map(p => {
                const model = p.dataCount >= 3 ? getModelForDataPoints(p.dataCount) : null;
                const quality = p.dataCount >= 3 ? getDataQualityMessage(p.dataCount) : null;
                return (
                  <SelectItem key={p.id} value={p.code} disabled={p.dataCount < 3}>
                    <div className="flex items-center gap-2">
                      <span>{p.code} - {p.name}</span>
                      <span className="text-xs text-muted-foreground">({p.dataCount} kỳ)</span>
                      {p.dataCount < 3 && <span className="text-xs text-destructive">Thiếu dữ liệu</span>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Data quality badges */}
        {selectedProduct && (
          <div className="flex flex-wrap gap-2">
            {productDataCounts.filter(p => p.code === selectedProduct).map(p => {
              const quality = getDataQualityMessage(p.dataCount);
              const model = getModelForDataPoints(p.dataCount);
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span>{quality.icon}</span>
                  <span className="text-muted-foreground">{quality.message}</span>
                  <Badge variant="outline" className="font-mono text-xs">{model}</Badge>
                </div>
              );
            })}
          </div>
        )}
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
