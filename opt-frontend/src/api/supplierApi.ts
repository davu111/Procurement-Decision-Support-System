import inventoryApi from "./axiosConfig";
import type {
  Supplier,
  SupplierRequest,
  SupplierUpdateRequest,
  SupplierProduct,
  SupplierProductRequest,
  SupplierProductUpdateRequest,
} from "@/types/inventory-opt/supplier";

// ─── Supplier CRUD ───
export const supplierApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: Supplier[] }>("/suppliers")
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: Supplier }>(`/suppliers/${id}`)
      .then((r) => r.data),

  create: (data: SupplierRequest) =>
    inventoryApi
      .post<never, { data: Supplier }>("/suppliers", data)
      .then((r) => r.data),

  update: (data: SupplierUpdateRequest) =>
    inventoryApi
      .put<never, { data: Supplier }>(`/suppliers/${data.id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) => inventoryApi.delete(`/suppliers/${id}`),
  activate: (id: string) => inventoryApi.patch(`/suppliers/active/${id}`),
};

// ─── SupplierProduct CRUD ───
export const supplierProductApi = {
  getBySupplierId: (supplierId: string) =>
    inventoryApi
      .get<
        never,
        { data: SupplierProduct[] }
      >(`/suppliers/${supplierId}/products`)
      .then((r) => r.data),

  create: (supplierId: string, data: SupplierProductRequest) =>
    inventoryApi
      .post<
        never,
        { data: SupplierProduct }
      >(`/suppliers/${supplierId}/products`, data)
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: SupplierProduct }>(`/supplier-products/${id}`)
      .then((r) => r.data),

  update: (data: SupplierProductUpdateRequest) =>
    inventoryApi
      .put<
        never,
        { data: SupplierProduct }
      >(`/supplier-products/${data.id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) => inventoryApi.delete(`/supplier-products/${id}`),
  activate: (id: string) =>
    inventoryApi.patch(`/supplier-products/active/${id}`),
};
