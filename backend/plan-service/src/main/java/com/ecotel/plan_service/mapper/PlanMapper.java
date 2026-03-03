package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.FullPlanRequest;
import com.ecotel.plan_service.dto.request.FullPlanUpdateRequest;
import com.ecotel.plan_service.dto.response.FullPlanResponse;
import com.ecotel.plan_service.dto.response.vehicle.VehicleResponse;
import com.ecotel.plan_service.model.Plan;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PlanMapper {
    FullPlanResponse toFullPlanResponse (Plan plan);
    Plan toPlan (FullPlanRequest request);
    void updatePlan(FullPlanUpdateRequest request,@MappingTarget Plan plan);
    VehicleResponse toVehicleResponse(Plan plan);
}
