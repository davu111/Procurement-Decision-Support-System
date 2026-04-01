package com.ecotel.supplier_service.mapper;

import com.ecotel.supplier_service.dto.request.SupplierProductRequest;
import com.ecotel.supplier_service.dto.request.SupplierProductUpdateRequest;
import com.ecotel.supplier_service.dto.response.SupplierProductResponse;
import com.ecotel.supplier_service.model.SupplierProduct;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierProductMapper {
    SupplierProduct toSupplierProduct(SupplierProductRequest request);
    SupplierProductResponse toSupplierProductResponse(SupplierProduct supplierProduct);

    @Mapping(target = "isActive", ignore = true) // Không cập nhật trường isActive từ request
    void updateSupplierProductFromRequest(SupplierProductUpdateRequest request, @MappingTarget SupplierProduct supplierProduct);
}
