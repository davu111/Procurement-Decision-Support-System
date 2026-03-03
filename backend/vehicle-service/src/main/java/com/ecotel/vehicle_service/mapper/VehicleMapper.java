package com.ecotel.vehicle_service.mapper;

import com.ecotel.vehicle_service.dto.request.VehicleRequest;
import com.ecotel.vehicle_service.dto.request.VehicleTypeRequest;
import com.ecotel.vehicle_service.dto.response.VehicleResponse;
import com.ecotel.vehicle_service.model.Vehicle;
import com.ecotel.vehicle_service.model.VehicleType;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface VehicleMapper {
    VehicleResponse toVehicleResponse(Vehicle vehicle);
    Vehicle toVehicle(VehicleRequest vehicleRequest);

    void updateVehicleFromRequest(VehicleRequest vehicleRequest, @MappingTarget Vehicle vehicle);
}
