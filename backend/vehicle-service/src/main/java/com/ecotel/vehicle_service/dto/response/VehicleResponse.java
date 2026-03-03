package com.ecotel.vehicle_service.dto.response;

import com.ecotel.vehicle_service.enums.VehicleState;
import com.ecotel.vehicle_service.model.VehicleType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleResponse {
    String id;
    String vehicleName;
    String licensePlate;
    String siteId;
    VehicleTypeResponse vehicleType;
    VehicleState currentState;
    String currentPlanId;
    String currentLocation;
    Boolean inWarehouseFlag;
}
