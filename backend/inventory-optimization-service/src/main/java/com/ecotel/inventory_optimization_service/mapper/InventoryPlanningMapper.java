package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.response.InventoryParameterResponse;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventoryPlanningMapper {
    InventoryParameter toInventoryParameter(InventoryParameterRequest request);
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "warehouseConfigId", source = "warehouseConfig.id")
    InventoryParameterResponse toInventoryParameterResponse(InventoryParameter parameter);
}
