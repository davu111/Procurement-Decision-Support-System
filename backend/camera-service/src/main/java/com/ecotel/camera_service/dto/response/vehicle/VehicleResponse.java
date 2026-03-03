package com.ecotel.camera_service.dto.response.vehicle;

import com.ecotel.camera_service.enums.VehicleState;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleResponse {
    String id;
    String vehicleName;
    String licensePlate;
    String siteId;
    VehicleState currentState;
    String currentPlanId;
    Boolean inWarehouseFlag;
}
