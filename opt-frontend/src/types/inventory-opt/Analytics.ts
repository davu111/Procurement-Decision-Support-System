export interface LossRateAnalysis {
  productId: string;
  productName?: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  stockCountsUsed: number;
  avgLossRate: number; // 0.035 = 3.5%
  totalLossValue: number; // VND
  configuredSpoilageRate: number;
  exceedsWarningThreshold: boolean;
  suggestUpdateSpoilageRate: boolean;
  message: string;
  details: StockCountDetail[];
}

export interface StockCountDetail {
  id: number;
  countDate: string;
  systemQuantity: number;
  actualQuantity: number;
  varianceQty: number;
  varianceRate: number;
  varianceValue: number;
  lossWarning?: boolean;
}

export interface ServiceLevelAnalysis {
  productId: string;
  productName?: string;
  fromDate: string;
  toDate: string;
  totalCycles: number;
  stockoutFrequency: number; // 0.05 = 5%
  serviceLevel: number; // 0.95 = 95%
  avgStockoutDuration: number; // days
  avgDeliveryDelay: number; // days
  totalStockoutDays: number;
  totalDelayDays: number;
  cyclesWithActualDelivery: number;
}
