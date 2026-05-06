export interface Warehouse {
  id: string;
  warehouseName: string;
  isActive?: boolean | string;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  lastUpdated: string;
}

export interface FullWarehouse {
  id: string;
  warehouseName: string;
  totalInventory: number;
  items: number;
  inventories: InventoryItem[];
  isActive?: boolean | string;
  configId?: number;
}

export interface WarehouseConfigResponse {
  id: number;
  interestRate: number;
  warehouseMonthlyCost: number;
  warehouseMaxCapacity: number;
  spoilageRate: number;
  insuranceRate: number;
  storageCostCoefficient?: number;
  updatedAt?: string;
}

export interface WarehouseConfigRequest {
  warehouseId: string;
  interestRate: number;
  warehouseMonthlyCost: number;
  warehouseMaxCapacity: number;
  spoilageRate: number;
  insuranceRate: number;
}

export interface WarehouseRequest {
  warehouseName: string;
  warehouseConfigRequest: WarehouseConfigRequest;
}

export interface WarehouseConfigUpdateRequest {
  id?: number;
  warehouseId?: string;
  interestRate?: number;
  warehouseMonthlyCost?: number;
  warehouseMaxCapacity?: number;
  spoilageRate?: number;
  insuranceRate?: number;
  storageCostCoefficient?: number;
  updatedAt?: string;
}

export interface WarehouseUpdateRequest {
  id: string;
  warehouseName?: string;
  warehouseConfigUpdateRequest?: WarehouseConfigUpdateRequest;
  isActive?: boolean;
}

export type WorkType = "IMPORT" | "EXPORT";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface TransactionRequest {
  warehouseId: string;
  workType: WorkType;
  productQuantities: Record<string, number>;
}

export interface InOutDetail {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
}

export interface InOutTransaction {
  id: string;
  transactionCode: string;
  warehouseId: string;
  workType: WorkType;
  status: TransactionStatus;
  createdAt: string;
  confirmedAt: string | null;
  updatedAt: string | null;
  inOutDetails: InOutDetail[];
}

export interface InOutDetailRequest {
  productId: string;
  quantity: number;
}

export interface InOutTransactionRequest {
  warehouseId: string;
  workType: WorkType;
  inOutDetails: InOutDetailRequest[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
