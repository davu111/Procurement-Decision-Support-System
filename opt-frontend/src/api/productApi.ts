import inventoryApi from "./axiosConfig";
import type {
  Product,
  ProductRequest,
  ProductStatus,
} from "@/types/product/product";

export interface ProductLite {
  id: string | number;
  productName?: string;
  name?: string;
  productCode?: string;
  code?: string;
  unit?: string;
}

export const productApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: ProductLite[] }>("/products")
      .then((r) => r.data)
      .catch(() => [] as ProductLite[]),

  list: (params?: { categoryId?: string; status?: ProductStatus }) =>
    inventoryApi
      .get<never, { data: Product[] }>("/products", {
        params: {
          categoryId: params?.categoryId ?? "all",
          ...(params?.status ? { status: params.status } : {}),
        },
      })
      .then((r) => r.data),

  create: (data: ProductRequest) =>
    inventoryApi
      .post<never, { data: Product }>("/products", data)
      .then((r) => r.data),

  update: (id: string, data: ProductRequest) =>
    inventoryApi
      .put<never, { data: Product }>(`/products/${id}`, data)
      .then((r) => r.data),

  deactivate: (id: string) =>
    inventoryApi
      .patch<never, { data: Product }>(`/products/deactivate/${id}`)
      .then((r) => r.data),

  activate: (id: string) =>
    inventoryApi
      .patch<never, { data: Product }>(`/products/activate/${id}`)
      .then((r) => r.data),

  getImageUrl: (productId: string) =>
    inventoryApi
      .get<never, { data: string }>(`/product-images/${productId}`)
      .then((r) => r.data),

  getImageUrlsBatch: (productIds: string[]) =>
    inventoryApi
      .post<
        never,
        { data: Record<string, string> }
      >("/product-images/batch-urls", productIds)
      .then((r) => r.data),

  uploadImage: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return inventoryApi
      .post<never, { data: unknown }>(
        `/product-images/upload/${productId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      )
      .then((r) => r.data);
  },
};
