package com.ecotel.vehicle_service.mapper;

import com.ecotel.vehicle_service.dto.request.VehicleStateHistoryRequest;
import com.ecotel.vehicle_service.dto.response.VehicleStateHistoryResponse;
import com.ecotel.vehicle_service.model.VehicleStateHistory;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface VehicleStateHistoryMapper {
    VehicleStateHistoryResponse toVehicleStateHistoryResponse(VehicleStateHistory vehicle);
    VehicleStateHistory toVehicleStateHistory(VehicleStateHistoryRequest vehicleRequest);

    void updateVehicleStateHistoryFromRequest(VehicleStateHistoryRequest vehicleRequest, @MappingTarget VehicleStateHistory vehicle);
}
