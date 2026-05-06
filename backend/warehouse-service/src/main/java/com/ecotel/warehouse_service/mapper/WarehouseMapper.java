package com.ecotel.warehouse_service.mapper;

import com.ecotel.warehouse_service.dto.request.WarehouseRequest;
import com.ecotel.warehouse_service.dto.request.WarehouseUpdateRequest;
import com.ecotel.warehouse_service.dto.response.FullWarehouseResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseResponse;
import com.ecotel.warehouse_service.model.Warehouse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {
    Warehouse toWarehouse(WarehouseRequest response);
    WarehouseResponse toWarehouseResponse(Warehouse warehouse);
    FullWarehouseResponse toFullWarehouseResponse(Warehouse warehouse);

    void updateWarehouseFromRequest(WarehouseUpdateRequest request, @MappingTarget Warehouse warehouse);
}
