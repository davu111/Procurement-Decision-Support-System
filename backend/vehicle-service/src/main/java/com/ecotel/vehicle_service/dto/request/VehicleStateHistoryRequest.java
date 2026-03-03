package com.ecotel.vehicle_service.dto.request;

import com.ecotel.vehicle_service.enums.VehicleState;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleStateHistoryRequest {
    String vehicleId;
    VehicleState stateCode;
    LocalDateTime timestamp;
    String warehouseId;
    String note;
}
