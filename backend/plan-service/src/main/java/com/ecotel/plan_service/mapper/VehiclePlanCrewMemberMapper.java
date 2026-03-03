package com.ecotel.plan_service.mapper;

import com.ecotel.plan_service.dto.request.VehiclePlanCrewMemberRequest;
import com.ecotel.plan_service.dto.response.VehiclePlanCrewMemberResponse;
import com.ecotel.plan_service.model.VehiclePlanCrewMember;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VehiclePlanCrewMemberMapper {
    VehiclePlanCrewMemberResponse toVehiclePlanCrewMemberResponse(VehiclePlanCrewMember vehiclePlanCrewMember);
    VehiclePlanCrewMember toVehiclePlanCrewMember(VehiclePlanCrewMemberRequest request);
}
