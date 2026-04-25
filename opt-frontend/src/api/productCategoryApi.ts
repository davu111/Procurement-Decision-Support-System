import inventoryApi from "./axiosConfig";
import type {
  ProductCategory,
  ProductCategoryRequest,
} from "@/types/product/productCategory";

export const productCategoryApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: ProductCategory[] }>("/product-categories")
      .then((r) => r.data),

  getById: (id: string) =>
    inventoryApi
      .get<never, { data: ProductCategory }>(`/product-categories/${id}`)
      .then((r) => r.data),

  create: (data: ProductCategoryRequest) =>
    inventoryApi
      .post<never, { data: ProductCategory }>("/product-categories", data)
      .then((r) => r.data),

  update: (id: string, data: ProductCategoryRequest) =>
    inventoryApi
      .put<never, { data: ProductCategory }>(`/product-categories/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    inventoryApi
      .patch<
        never,
        { data: ProductCategory }
      >(`/product-categories/deactivate/${id}`)
      .then((r) => r.data),

  activate: (id: string) =>
    inventoryApi
      .patch<
        never,
        { data: ProductCategory }
      >(`/product-categories/activate/${id}`)
      .then((r) => r.data),
};
