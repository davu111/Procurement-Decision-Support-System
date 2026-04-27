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
}

export interface WarehouseRequest {
  warehouseName: string;
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

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
