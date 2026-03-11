package com.ecotel.supplier_service.mapper;

import com.ecotel.supplier_service.dto.request.SupplierRequest;
import com.ecotel.supplier_service.dto.request.SupplierUpdateRequest;
import com.ecotel.supplier_service.dto.response.SupplierResponse;
import com.ecotel.supplier_service.model.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SupplierMapper {
    Supplier toSupplier(SupplierRequest request);
    SupplierResponse toSupplierResponse(Supplier supplier);

    void updateSupplierFromRequest(SupplierUpdateRequest request, @MappingTarget Supplier supplier);
}
