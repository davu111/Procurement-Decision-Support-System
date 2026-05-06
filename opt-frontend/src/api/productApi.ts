import inventoryApi from "./axiosConfig";
import type {
  Product,
  ProductRequest,
  ProductStatus,
} from "@/types/product/product";

export interface ProductLite {
  id: string | number;
  productName?: string;
  code?: string;
  unit?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const productApi = {
  getAll: () =>
    inventoryApi
      .get<never, { data: ProductLite[] }>("/products/all")
      .then((r) => r.data)
      .catch(() => [] as ProductLite[]),

  list: (params?: {
    categoryId?: string;
    status?: ProductStatus;
    page?: number;
    size?: number;
    sort?: string; // e.g. "productName,asc" | "updatedAt,desc" | "createdAt,asc"
  }) =>
    inventoryApi
      .get<never, { data: PageResponse<Product> | Product[] }>("/products", {
        params: {
          categoryId: params?.categoryId ?? "all",
          ...(params?.status ? { status: params.status } : {}),
          page: params?.page ?? 0,
          size: params?.size ?? 12,
          ...(params?.sort ? { sort: params.sort } : {}),
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
