package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.VehiclePlanAreaRequest;
import com.ecotel.plan_service.dto.response.VehiclePlanAreaResponse;
import com.ecotel.plan_service.model.VehiclePlan;
import com.ecotel.plan_service.model.VehiclePlanArea;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VehiclePlanAreaMapper {
    VehiclePlanAreaResponse toAreaResponse(VehiclePlanArea vehiclePlanArea);
    VehiclePlanArea toArea(VehiclePlanAreaRequest request);
}
