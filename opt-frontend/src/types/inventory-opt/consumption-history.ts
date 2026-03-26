export interface ConsumptionHistory {
  id: string;
  productId: number;
  planningUnit: string;
  periodStartDate: string; // ngày đầu kỳ
  periodEndDate: string; // ngày cuối kỳ
  actualConsumption: number; // Q thực tế trong kỳ
  plannedConsumption: number; // Q kế hoạch (để tính sai số)
  actualLeadTimeDays: number; // L thực tế (ngày) - tính từ ngày đặt đến ngày nhận
  actualSupplyRate: number; // K thực tế trong kỳ
  notes: string;
  createdAt: string;
}
