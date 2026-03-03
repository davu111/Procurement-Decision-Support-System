package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.DetailPlanWarehouseProductRequest;
import com.ecotel.plan_service.dto.response.DetailPlanWarehouseProductResponse;
import com.ecotel.plan_service.model.DetailPlanWarehouseProduct;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DetailPlanWarehouseProductMapper {
    DetailPlanWarehouseProductResponse toDetailPlanWarehouseProductResponse(DetailPlanWarehouseProduct detailPlanWarehouseProduct);
    DetailPlanWarehouseProduct toDetailPlanWarehouseProduct(DetailPlanWarehouseProductRequest request);
}
