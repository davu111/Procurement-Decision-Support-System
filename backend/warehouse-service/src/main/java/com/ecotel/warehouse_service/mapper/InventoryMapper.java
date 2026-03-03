package com.ecotel.warehouse_service.mapper;

import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.model.Inventory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventoryMapper {
    @Mapping(source = "warehouse.id", target = "warehouseId")
    InventoryResponse toInventoryResponse(Inventory inventory);
}
