package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConsumptionHistoryMapper {
    ConsumptionHistory toConsumptionHistory(ConsumptionHistoryRequest request);
    @Mapping(target = "productId", source = "history.product.id")
    ConsumptionHistoryResponse toConsumptionHistoryResponse(ConsumptionHistory history);
}
