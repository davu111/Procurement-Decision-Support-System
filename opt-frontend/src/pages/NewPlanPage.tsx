import { useState } from 'react';
import { mockProducts, mockWarehouseConfig, mockInventoryResult } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { PlanningUnit, ForecastSuggestion, InventoryResult } from '@/types';

export default function NewPlanPage() {
  const [productId, setProductId] = useState<string>('');
  const [planningUnit, setPlanningUnit] = useState<PlanningUnit>('MONTH');
  const [planStartDate, setPlanStartDate] = useState('');
  const [demandQ, setDemandQ] = useState('');
  const [storageI, setStorageI] = useState(mockWarehouseConfig.storageCostCoefficient.toString());

  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ForecastSuggestion | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<InventoryResult | null>(null);

  const handleGetSuggestion = () => {
    setLoadingSuggestion(true);
    // Mock AI suggestion
    setTimeout(() => {
      setSuggestion({
        productId: Number(productId),
        planningUnit,
        suggestedQ: 105.5,
        requiresManualInput: false,
        supplierName: 'Công ty TNHH Lương thực Miền Nam',
        supplierProductId: 1,
        currentSupplyRateK: 166.67,
        currentFixedOrderCostA: 2000000,
        currentUnitPriceC: 8500000,
        currentLeadTimeDays: 30,
        demandForecast: { forecastValue: 105.5, modelUsed: 'HOLT_WINTERS', dataPointsUsed: 24, mape: 8.3, mapeWarning: false },
        leadTimeForecast: { forecastValue: 0.0967, modelUsed: 'WMA', dataPointsUsed: 5, mape: null, mapeWarning: false },
      });
      setDemandQ('105.5');
      setLoadingSuggestion(false);
    }, 1500);
  };

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalcResult(mockInventoryResult);
      setCalculating(false);
    }, 1000);
  };

  const selectedProduct = mockProducts.find(p => p.id === Number(productId));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tạo kỳ kế hoạch mới</h1>
        <p className="text-muted-foreground mt-1">Tính toán lượng đặt hàng tối ưu cho kỳ kế hoạch</p>
      </div>

      {/* Step 1: Select product & period */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Bước 1: Chọn mặt hàng & kỳ kế hoạch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mặt hàng</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Chọn mặt hàng..." /></SelectTrigger>
              <SelectContent>
                {mockProducts.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.code} - {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Đơn vị kỳ</Label>
            <Select value={planningUnit} onValueChange={(v) => setPlanningUnit(v as PlanningUnit)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTH">Tháng</SelectItem>
                <SelectItem value="QUARTER">Quý</SelectItem>
                <SelectItem value="YEAR">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ngày bắt đầu</Label>
            <Input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} />
          </div>
        </div>

        {productId && (
          <Button onClick={handleGetSuggestion} disabled={loadingSuggestion} variant="outline" className="gap-2">
            {loadingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Lấy gợi ý AI
          </Button>
        )}
      </div>

      {/* AI Suggestion panel */}
      {suggestion && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Gợi ý từ AI</h2>
            <Badge className="bg-status-success text-destructive-foreground">SUPPLIER_SERVICE ✓</Badge>
          </div>

          {suggestion.requiresManualInput && (
            <div className="bg-status-warning-bg border border-status-warning/30 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <p className="text-sm">Chưa đủ dữ liệu lịch sử. Vui lòng nhập Q theo kinh nghiệm.</p>
            </div>
          )}

          {suggestion.demandForecast.mapeWarning && (
            <div className="bg-status-warning-bg border border-status-warning/30 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
              <p className="text-sm">MAPE = {suggestion.demandForecast.mape}%. Dự báo kém chính xác, hãy kiểm tra lại.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">Nhà cung cấp</p>
              <p className="font-medium text-foreground">{suggestion.supplierName}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">Q đề xuất ({suggestion.demandForecast.modelUsed})</p>
              <p className="font-mono font-medium text-foreground">{formatNumber(suggestion.suggestedQ)} {selectedProduct?.unit}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">K (năng lực cung cấp)</p>
              <p className="font-mono font-medium text-foreground">{formatNumber(suggestion.currentSupplyRateK)} {selectedProduct?.unit}/{planningUnit === 'MONTH' ? 'tháng' : planningUnit === 'QUARTER' ? 'quý' : 'năm'}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">A (chi phí đặt hàng)</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(suggestion.currentFixedOrderCostA)} VNĐ/lần</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">C (đơn giá)</p>
              <p className="font-mono font-medium text-foreground">{formatCurrency(suggestion.currentUnitPriceC)} VNĐ/{selectedProduct?.unit}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground">L (lead time)</p>
              <p className="font-mono font-medium text-foreground">{suggestion.currentLeadTimeDays} ngày</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Calculate */}
      <div className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Bước 2: Xác nhận tham số & Tính toán</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Q (Nhu cầu tiêu thụ trong kỳ)</Label>
            <Input type="number" value={demandQ} onChange={e => setDemandQ(e.target.value)} placeholder="Nhập nhu cầu..." />
          </div>
          <div className="space-y-2">
            <Label>I (Hệ số bảo quản - theo năm)</Label>
            <Input type="number" value={storageI} onChange={e => setStorageI(e.target.value)} step="0.001" />
          </div>
        </div>
        <Button onClick={handleCalculate} disabled={calculating || !demandQ || !productId} className="gap-2">
          {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Tính toán kế hoạch
        </Button>
      </div>

      {/* Result */}
      {calcResult && (
        <div className="bg-card border rounded-lg p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-status-success" />
            Kết quả tối ưu
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'S* (Lượng đặt tối ưu)', value: `${formatNumber(calcResult.optimalOrderQtyS)} ${selectedProduct?.unit || ''}` },
              { label: 'n* (Số lần đặt)', value: formatNumber(calcResult.optimalOrderCountN) },
              { label: 'τ* (Chu kỳ)', value: `${formatNumber(calcResult.optimalCycleTimeTau, 4)} kỳ` },
              { label: 'B (Điểm đặt hàng)', value: `${formatNumber(calcResult.reorderPointB)} ${selectedProduct?.unit || ''}` },
              { label: 'Z (Tồn kho TB)', value: `${formatNumber(calcResult.avgInventoryLevel)} ${selectedProduct?.unit || ''}` },
              { label: 'D_min (Chi phí tối thiểu)', value: formatCurrency(calcResult.minTotalCost) },
              { label: 'Tổng chi phí (gồm mua)', value: formatCurrency(calcResult.totalCostWithPurchase) },
              { label: 'Mức tồn kho tối đa', value: `${formatNumber(calcResult.maxInventoryLevel)} ${selectedProduct?.unit || ''}` },
              { label: 'm (floor(L/τ*))', value: calcResult.mValue.toString() },
            ].map(m => (
              <div key={m.label} className="bg-muted rounded-md p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold font-mono text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
