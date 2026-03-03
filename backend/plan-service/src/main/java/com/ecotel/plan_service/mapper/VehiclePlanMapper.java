package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.VehiclePlanRequest;
import com.ecotel.plan_service.dto.response.VehiclePlanResponse;
import com.ecotel.plan_service.model.VehiclePlan;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VehiclePlanMapper {
    VehiclePlanResponse toVehiclePlanResponse(VehiclePlan vehiclePlan);
    VehiclePlan toVehiclePlan(VehiclePlanRequest request);
}
