export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  supplierCode: string;
  supplierName: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface SupplierUpdateRequest extends SupplierRequest {
  id: string;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  productId: string;
  productName: string;
  maxSupplyPerMonth: number;
  fixedOrderCost: number;
  unitPrice: number;
  committedLeadTimeDays: number;
  effectiveDate: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProductRequest {
  productId: string;
  maxSupplyPerMonth: number;
  fixedOrderCost: number;
  unitPrice: number;
  committedLeadTimeDays: number;
  effectiveDate: string;
  notes?: string;
}

export interface SupplierProductUpdateRequest extends SupplierProductRequest {
  id: string;
}
