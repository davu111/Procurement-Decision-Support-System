import inventoryApi from "./axiosConfig";
import type {
  Warehouse,
  FullWarehouse,
  WarehouseRequest,
  WarehouseUpdateRequest,
  WarehouseConfigResponse,
  TransactionRequest,
  InventoryItem,
  InOutTransaction,
  PageResponse,
  InOutTransactionRequest,
} from "@/types/warehouse/warehouse";

export const warehouseApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: Warehouse[] }>("/warehouses")
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: Warehouse }>(`/warehouses/${id}`)
      .then((r) => r.data),

  getFullInfo: () =>
    inventoryApi
      .get<never, { data: FullWarehouse[] }>("/warehouses/full-info")
      .then((r) => r.data),

  getFullInfoById: (id: string) =>
    inventoryApi
      .get<never, { data: FullWarehouse }>(`/warehouses/full-info/${id}`)
      .then((r) => r.data),

  create: (data: WarehouseRequest) =>
    inventoryApi
      .post<never, { data: Warehouse }>("/warehouses", data)
      .then((r) => r.data),

  update: (data: WarehouseUpdateRequest) =>
    inventoryApi
      .put<never, { data: Warehouse }>("/warehouses", data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    inventoryApi
      .patch<never, { data: Warehouse }>(`/warehouses/deactivate/${id}`)
      .then((r) => r.data),

  activate: (id: string) =>
    inventoryApi
      .patch<never, { data: Warehouse }>(`/warehouses/activate/${id}`)
      .then((r) => r.data),

  getConfigById: (configId: number) =>
    inventoryApi
      .get<
        never,
        { data: WarehouseConfigResponse }
      >(`/warehouse-config/${configId}`)
      .then((r) => r.data),
};

export const inventoryTransferApi = {
  transfer: (data: TransactionRequest) =>
    inventoryApi
      .put<never, { data: InventoryItem[] }>("/inventories/transfer", data)
      .then((r) => r.data),
};

export const transactionApi = {
  create: (data: InOutTransactionRequest) =>
    inventoryApi
      .post<never, { data: InOutTransaction }>("/transactions/create", data)
      .then((r) => r.data),

  generateReport: (transactionId: string) =>
    inventoryApi
      .post<never, { data: number }>("/transactions/generate", null, {
        params: { transactionId },
      })
      .then((r) => r.data),

  getAll: (params: {
    page?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
  }) =>
    inventoryApi
      .get<
        never,
        { data: PageResponse<InOutTransaction> }
      >("/transactions", { params })
      .then((r) => r.data),

  getByWarehouseId: (
    warehouseId: string,
    params: {
      page?: number;
      size?: number;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    inventoryApi
      .get<
        never,
        { data: PageResponse<InOutTransaction> }
      >(`/transactions/warehouse/${warehouseId}`, { params })
      .then((r) => r.data),
};

export const fileApi = {
  getViewUrl: (fileId: number | string) =>
    inventoryApi
      .get<never, { data: string }>(`/files/${fileId}/view-url`)
      .then((r) => r.data),
  getDownloadUrl: (fileId: number | string) =>
    inventoryApi
      .get<never, { data: string }>(`/files/${fileId}/download-url`)
      .then((r) => r.data),
};
