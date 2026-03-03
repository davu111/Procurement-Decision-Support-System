package com.ecotel.warehouse_service.mapper;

import com.ecotel.warehouse_service.dto.response.FullWarehouseResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseResponse;
import com.ecotel.warehouse_service.model.Warehouse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {
    WarehouseResponse toWarehouseResponse(Warehouse warehouse);
    FullWarehouseResponse toFullWarehouseResponse(Warehouse warehouse);
}
