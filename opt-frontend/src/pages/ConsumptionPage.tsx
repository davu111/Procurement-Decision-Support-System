import { useState } from 'react';
import { mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanningUnit } from '@/types';

export default function ConsumptionPage() {
  const [productId, setProductId] = useState('');
  const [planningUnit, setPlanningUnit] = useState<PlanningUnit>('MONTH');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [actualConsumption, setActualConsumption] = useState('');
  const [plannedConsumption, setPlannedConsumption] = useState('');
  const [actualLeadTime, setActualLeadTime] = useState('');
  const [actualSupplyRate, setActualSupplyRate] = useState('');
  const [notes, setNotes] = useState('');

  // Mock AI progress
  const dataPoints = 12;
  const maxPoints = 18;
  const progressPercent = (dataPoints / maxPoints) * 100;
  const currentModel = dataPoints >= 18 ? 'Seasonal Regression' : dataPoints >= 6 ? 'Holt-Winters' : 'WMA';
  const nextModel = dataPoints >= 18 ? null : dataPoints >= 6 ? 'Seasonal Regression' : 'Holt-Winters';
  const pointsNeeded = dataPoints >= 18 ? 0 : dataPoints >= 6 ? 18 - dataPoints : 6 - dataPoints;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Đã lưu dữ liệu tiêu thụ thành công!', {
      description: `Cần thêm ${pointsNeeded} điểm để nâng cấp mô hình AI.`,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nhập tiêu thụ thực tế</h1>
        <p className="text-muted-foreground mt-1">Dữ liệu nền cho AI dự báo nhu cầu</p>
      </div>

      {/* AI Progress */}
      <div className="bg-card border rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Tiến trình AI</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dữ liệu lịch sử</span>
            <span className="font-mono font-medium text-foreground">{dataPoints}/{maxPoints} điểm</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mô hình hiện tại: <span className="font-medium text-foreground">{currentModel}</span></span>
            {nextModel && (
              <span className="text-muted-foreground">Cần thêm {pointsNeeded} điểm → {nextModel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Thông tin kỳ</h2>
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
            <Label>Ngày bắt đầu kỳ</Label>
            <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Ngày kết thúc kỳ</Label>
            <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
          </div>
        </div>

        <h2 className="font-semibold text-foreground pt-2">Dữ liệu thực tế</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tiêu thụ thực tế</Label>
            <Input type="number" value={actualConsumption} onChange={e => setActualConsumption(e.target.value)} required placeholder="VD: 132.0" />
          </div>
          <div className="space-y-2">
            <Label>Tiêu thụ kế hoạch</Label>
            <Input type="number" value={plannedConsumption} onChange={e => setPlannedConsumption(e.target.value)} required placeholder="VD: 120.0" />
          </div>
          <div className="space-y-2">
            <Label>Lead time thực tế (ngày)</Label>
            <Input type="number" value={actualLeadTime} onChange={e => setActualLeadTime(e.target.value)} placeholder="VD: 29" />
          </div>
          <div className="space-y-2">
            <Label>Tốc độ cung cấp thực tế</Label>
            <Input type="number" value={actualSupplyRate} onChange={e => setActualSupplyRate(e.target.value)} placeholder="VD: 170" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ghi chú</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="VD: Tháng Tết, tiêu thụ tăng cao..." />
        </div>

        <Button type="submit" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Lưu dữ liệu
        </Button>
      </form>
    </div>
  );
}
