package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InventoryResultMapper {
    InventoryCalculationResult toInventoryCalculationResult(InventoryResult inventoryResult);
}
