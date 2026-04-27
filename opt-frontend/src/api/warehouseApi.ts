import inventoryApi from "./axiosConfig";
import type {
  Warehouse,
  FullWarehouse,
  WarehouseRequest,
  TransactionRequest,
  InventoryItem,
  InOutTransaction,
  PageResponse,
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

  update: (id: string, data: WarehouseRequest) =>
    inventoryApi
      .put<never, { data: Warehouse }>(`/warehouses/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    inventoryApi
      .patch<never, { data: Warehouse }>(`/warehouses/deactivate/${id}`)
      .then((r) => r.data),

  activate: (id: string) =>
    inventoryApi
      .patch<never, { data: Warehouse }>(`/warehouses/activate/${id}`)
      .then((r) => r.data),
};

export const inventoryTransferApi = {
  transfer: (data: TransactionRequest) =>
    inventoryApi
      .put<never, { data: InventoryItem[] }>("/inventories/transfer", data)
      .then((r) => r.data),
};

export const transactionApi = {
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
