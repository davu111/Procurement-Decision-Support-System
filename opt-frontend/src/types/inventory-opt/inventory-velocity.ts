export interface InventoryVelocitySummary {
  analysisFrom: string; // ISO date string (YYYY-MM-DD)
  analysisTo: string; // ISO date string (YYYY-MM-DD)
  totalProducts: number;
  dataMonths: number;
  abcDistribution: Record<string, number>; // e.g. { A: 3, B: 5, C: 7 }
  velocityDistribution: Record<string, number>; // e.g. { FAST: 4, NORMAL: 7, SLOW: 4 }
  totalConsumptionValue: number;
}

export interface ProductVelocity {
  productId: string;
  productName: string;
  unit: string;
  categoryName: string;

  abcClass: 'A' | 'B' | 'C';
  velocityClass: 'FAST' | 'NORMAL' | 'SLOW';
  trend: 'GROWING' | 'STABLE' | 'DECLINING';

  totalConsumption: number;
  avgMonthlyConsumption: number;
  totalConsumptionValue: number;
  unitPrice: number;

  recentAvgConsumption: number;
  previousAvgConsumption: number;
  trendRate: number; // percentage (e.g. 0.0448 = +4.48%)

  avgInventory: number;
  inventorySource: 'STOCK_COUNT' | 'THEORETICAL' | 'UNAVAILABLE';
  turnoverRatio: number | null;
  daysInventoryOutstanding: number | null;

  dataPointsUsed: number;
  insufficientData: boolean;
}

export interface InventoryVelocityResponse {
  summary: InventoryVelocitySummary;
  products: ProductVelocity[];
}
