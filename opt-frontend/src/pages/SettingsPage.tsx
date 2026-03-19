import { mockWarehouseConfig } from '@/data/mockData';
import { formatNumber, formatCurrency } from '@/utils/helpers';
import { Warehouse } from 'lucide-react';

export default function SettingsPage() {
  const config = mockWarehouseConfig;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cấu hình kho</h1>
        <p className="text-muted-foreground mt-1">Thông tin cấu hình kho hiện tại</p>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Warehouse className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">{config.configName}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Lãi suất', value: `${(config.interestRate * 100).toFixed(2)}%` },
            { label: 'Chi phí kho/tháng', value: `${formatCurrency(config.warehouseMonthlyCost)} VNĐ` },
            { label: 'Sức chứa tối đa', value: `${formatNumber(config.warehouseMaxCapacity)} tấn` },
            { label: 'Tỷ lệ hao hụt', value: `${(config.spoilageRate * 100).toFixed(2)}%` },
            { label: 'Tỷ lệ bảo hiểm', value: `${(config.insuranceRate * 100).toFixed(2)}%` },
            { label: 'I (Hệ số bảo quản)', value: formatNumber(config.storageCostCoefficient, 4) },
          ].map(item => (
            <div key={item.label} className="bg-muted rounded-md p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-lg font-mono font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
