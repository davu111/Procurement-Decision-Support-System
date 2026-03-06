package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InventoryPlanningMapper {
    InventoryParameter toInventoryParameter(InventoryParameterRequest request);
}
