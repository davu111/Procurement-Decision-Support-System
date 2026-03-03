package com.ecotel.vehicle_service.dto.request;

import com.ecotel.vehicle_service.enums.VehicleState;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleRequest {
    String vehicleName;
    String licensePlate;
    String siteId;
    VehicleTypeRequest vehicleType;
    VehicleState currentState;
    Boolean inWarehouseFlag;
}
