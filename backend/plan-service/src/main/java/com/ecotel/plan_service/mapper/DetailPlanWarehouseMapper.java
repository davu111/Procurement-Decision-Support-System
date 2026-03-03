package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.DetailPlanWarehouseRequest;
import com.ecotel.plan_service.dto.response.DetailPlanWarehouseResponse;
import com.ecotel.plan_service.model.DetailPlanWarehouse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DetailPlanWarehouseMapper {
    DetailPlanWarehouseResponse toDetailPlanWarehouseResponse(DetailPlanWarehouse detailPlanWarehouse);
    DetailPlanWarehouse toDetailPlanWarehouse(DetailPlanWarehouseRequest request);
}
