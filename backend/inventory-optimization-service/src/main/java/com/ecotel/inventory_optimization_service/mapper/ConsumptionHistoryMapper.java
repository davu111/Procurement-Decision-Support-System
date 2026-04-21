package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConsumptionHistoryMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", source = "product")
    @Mapping(target = "createdAt", ignore = true)
    ConsumptionHistory toConsumptionHistory(ConsumptionHistoryRequest request, Product product);
    @Mapping(target = "productId", source = "history.product.id")
    @Mapping(target = "productName", source = "history.product.name")
    ConsumptionHistoryResponse toConsumptionHistoryResponse(ConsumptionHistory history);
}
