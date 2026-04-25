export interface ProductCategory {
  id: string;
  categoryName: string;
  description: string;
  isActive: boolean;
}

export interface ProductCategoryRequest {
  categoryName: string;
  description: string;
}

export const isCategoryActive = (
  value: string | boolean | undefined | null,
): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  const v = String(value).toLowerCase().trim();
  return v === "true" || v === "active" || v === "1" || v === "yes";
};
