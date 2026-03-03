package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.DetailPlanRequest;
import com.ecotel.plan_service.dto.response.DetailPlanResponse;
import com.ecotel.plan_service.model.DetailPlan;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DetailPlanMapper {
    DetailPlanResponse toDetailPlanResponse(DetailPlan detailPlan);
    DetailPlan toDetailPlan(DetailPlanRequest request);
}
