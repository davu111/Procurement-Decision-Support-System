import inventoryApi from "./axiosConfig";

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
};
