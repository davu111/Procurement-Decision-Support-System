package com.ecotel.vehicle_service.dto.response;

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
public class VehicleStateHistoryResponse {
    String id;
    String vehicleId;
    VehicleState stateCode;
    LocalDateTime timestamp;
    String warehouseId;
    String note;
}
