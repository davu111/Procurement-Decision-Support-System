package com.ecotel.vehicle_service.mapper;

import com.ecotel.vehicle_service.dto.request.VehicleTypeRequest;
import com.ecotel.vehicle_service.dto.response.VehicleTypeResponse;
import com.ecotel.vehicle_service.model.VehicleType;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface VehicleTypeMapper {
    VehicleTypeResponse toVehicleTypeResponse(VehicleType vehicleType);
    VehicleType toVehicleType(VehicleTypeRequest vehicleTypeRequest);

    void updateVehicleTypeFromRequest(VehicleTypeRequest vehicleTypeRequest, @MappingTarget VehicleType vehicleType);
}
