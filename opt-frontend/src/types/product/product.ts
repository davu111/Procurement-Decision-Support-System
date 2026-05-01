export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface Product {
  id: string;
  code?: string;
  productName: string;
  unit: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  status: ProductStatus;
  imageUrl?: string;
}

export interface ProductRequest {
  code?: string;
  productName: string;
  unit: string;
  description?: string;
  categoryId?: string;
}
