package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.response.OrderScheduleResponse;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface OrderScheduleMapper {
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "inventoryResult.id", target = "inventoryResultId")
    OrderScheduleResponse toOrderScheduleResponse(OrderSchedule orderSchedule);
}
