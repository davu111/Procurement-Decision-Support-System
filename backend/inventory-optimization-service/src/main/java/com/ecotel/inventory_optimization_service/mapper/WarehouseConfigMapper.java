package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigRequest;
import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigUpdateRequest;
import com.ecotel.inventory_optimization_service.dto.response.WarehouseConfigResponse;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WarehouseConfigMapper {
    WarehouseConfig toEntity(WarehouseConfigRequest request);
    WarehouseConfigResponse toResponse(WarehouseConfig warehouseConfig);

    void update(WarehouseConfigUpdateRequest request, @MappingTarget WarehouseConfig warehouseConfig);
}
