import { Product, OrderSchedule, InventoryResult, WarehouseConfig, ConsumptionHistory } from '@/types';

export const mockProducts: Product[] = [
  { id: 1, code: 'NL001', name: 'Bột mì số 11', unit: 'Tấn', description: 'Bột mì nhập khẩu chất lượng cao', isActive: true, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 2, code: 'NL002', name: 'Đường tinh luyện', unit: 'Tấn', description: 'Đường trắng tinh luyện RE', isActive: true, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 3, code: 'NL003', name: 'Dầu ăn thực vật', unit: 'Tấn', description: 'Dầu ăn tinh luyện cao cấp', isActive: true, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 4, code: 'NL004', name: 'Bao bì carton', unit: 'Thùng', description: 'Bao bì đóng gói thành phẩm', isActive: true, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
  { id: 5, code: 'NL005', name: 'Bơ thực vật', unit: 'Tấn', description: 'Bơ thực vật nhập khẩu', isActive: true, createdAt: '2025-01-01T00:00:00', updatedAt: '2025-01-01T00:00:00' },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const mockOrderSchedules: OrderSchedule[] = [
  // Product 1 - Bột mì
  { id: 1, productId: 1, productCode: 'NL001', productName: 'Bột mì số 11', orderSequence: 1, orderDate: formatDate(addDays(today, -5)), expectedDeliveryDate: formatDate(addDays(today, 25)), orderQuantity: 111.88, estimatedCost: 952980000, isReorderWarning: false, actualOrderDate: formatDate(addDays(today, -5)), actualDeliveryDate: null, actualQuantity: null },
  { id: 2, productId: 1, productCode: 'NL001', productName: 'Bột mì số 11', orderSequence: 2, orderDate: formatDate(addDays(today, 18)), expectedDeliveryDate: formatDate(addDays(today, 48)), orderQuantity: 111.88, estimatedCost: 952980000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  { id: 3, productId: 1, productCode: 'NL001', productName: 'Bột mì số 11', orderSequence: 3, orderDate: formatDate(addDays(today, 52)), expectedDeliveryDate: formatDate(addDays(today, 82)), orderQuantity: 111.88, estimatedCost: 952980000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  // Product 2 - Đường
  { id: 4, productId: 2, productCode: 'NL002', productName: 'Đường tinh luyện', orderSequence: 1, orderDate: formatDate(addDays(today, 3)), expectedDeliveryDate: formatDate(addDays(today, 33)), orderQuantity: 54.76, estimatedCost: 834000000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  { id: 5, productId: 2, productCode: 'NL002', productName: 'Đường tinh luyện', orderSequence: 2, orderDate: formatDate(addDays(today, 40)), expectedDeliveryDate: formatDate(addDays(today, 70)), orderQuantity: 54.76, estimatedCost: 834000000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  // Product 3 - Dầu ăn
  { id: 6, productId: 3, productCode: 'NL003', productName: 'Dầu ăn thực vật', orderSequence: 1, orderDate: formatDate(addDays(today, -1)), expectedDeliveryDate: formatDate(addDays(today, 29)), orderQuantity: 43.98, estimatedCost: 970000000, isReorderWarning: true, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  // Product 4 - Bao bì
  { id: 7, productId: 4, productCode: 'NL004', productName: 'Bao bì carton', orderSequence: 1, orderDate: formatDate(addDays(today, 25)), expectedDeliveryDate: formatDate(addDays(today, 32)), orderQuantity: 30759, estimatedCost: 962000000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
  // Product 5 - Bơ
  { id: 8, productId: 5, productCode: 'NL005', productName: 'Bơ thực vật', orderSequence: 1, orderDate: formatDate(addDays(today, 45)), expectedDeliveryDate: formatDate(addDays(today, 60)), orderQuantity: 25.5, estimatedCost: 510000000, isReorderWarning: false, actualOrderDate: null, actualDeliveryDate: null, actualQuantity: null },
];

export const mockInventoryResult: InventoryResult = {
  optimalOrderQtyS: 111.88,
  optimalOrderCountN: 10.73,
  optimalCycleTimeTau: 0.0932,
  maxInventoryLevel: 44.75,
  avgInventoryLevel: 22.38,
  reorderPointB: 99.96,
  minTotalCost: 42920000,
  totalCostWithPurchase: 10242920000,
  replenishmentTimeTn: 0.05594,
  mValue: 0,
  demandQ: 1200,
  supplyRateK: 2000,
  fixedOrderCostA: 2000000,
  unitPriceC: 8500000,
  storageCoefficientI: 0.1128,
  leadTimeL: 0.0833,
  kMinusQFactor: 0.4,
};

export const mockWarehouseConfig: WarehouseConfig = {
  id: 1,
  configName: 'Kho chính - HCM 2025',
  interestRate: 0.085,
  warehouseMonthlyCost: 50000000,
  warehouseMaxCapacity: 5000,
  spoilageRate: 0.015,
  insuranceRate: 0.005,
  storageCostCoefficient: 0.1128,
  isDefault: true,
};

export const mockConsumptionHistory: ConsumptionHistory[] = [
  { id: 1, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-01-01', periodEndDate: '2024-01-31', actualConsumption: 98, plannedConsumption: 100, actualLeadTimeDays: 30, actualSupplyRate: 170, notes: '' },
  { id: 2, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-02-01', periodEndDate: '2024-02-29', actualConsumption: 105, plannedConsumption: 100, actualLeadTimeDays: 28, actualSupplyRate: 165, notes: 'Tháng Tết' },
  { id: 3, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-03-01', periodEndDate: '2024-03-31', actualConsumption: 112, plannedConsumption: 100, actualLeadTimeDays: 31, actualSupplyRate: 168, notes: '' },
  { id: 4, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-04-01', periodEndDate: '2024-04-30', actualConsumption: 95, plannedConsumption: 100, actualLeadTimeDays: 29, actualSupplyRate: 172, notes: '' },
  { id: 5, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-05-01', periodEndDate: '2024-05-31', actualConsumption: 108, plannedConsumption: 100, actualLeadTimeDays: 30, actualSupplyRate: 166, notes: '' },
  { id: 6, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-06-01', periodEndDate: '2024-06-30', actualConsumption: 115, plannedConsumption: 100, actualLeadTimeDays: 32, actualSupplyRate: 160, notes: 'Mùa hè cao điểm' },
  { id: 7, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-07-01', periodEndDate: '2024-07-31', actualConsumption: 120, plannedConsumption: 100, actualLeadTimeDays: 30, actualSupplyRate: 170, notes: '' },
  { id: 8, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-08-01', periodEndDate: '2024-08-31', actualConsumption: 110, plannedConsumption: 100, actualLeadTimeDays: 29, actualSupplyRate: 168, notes: '' },
  { id: 9, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-09-01', periodEndDate: '2024-09-30', actualConsumption: 102, plannedConsumption: 100, actualLeadTimeDays: 30, actualSupplyRate: 167, notes: '' },
  { id: 10, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-10-01', periodEndDate: '2024-10-31', actualConsumption: 97, plannedConsumption: 100, actualLeadTimeDays: 31, actualSupplyRate: 165, notes: '' },
  { id: 11, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-11-01', periodEndDate: '2024-11-30', actualConsumption: 105, plannedConsumption: 100, actualLeadTimeDays: 28, actualSupplyRate: 170, notes: '' },
  { id: 12, productId: 1, planningUnit: 'MONTH', periodStartDate: '2024-12-01', periodEndDate: '2024-12-31', actualConsumption: 132, plannedConsumption: 100, actualLeadTimeDays: 30, actualSupplyRate: 166, notes: 'Cuối năm tăng' },
];
