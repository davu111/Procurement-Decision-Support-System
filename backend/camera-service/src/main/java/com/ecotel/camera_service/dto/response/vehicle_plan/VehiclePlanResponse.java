package com.ecotel.camera_service.dto.response.vehicle_plan;


import com.ecotel.camera_service.enums.AreaCode;
import com.ecotel.camera_service.enums.Purpose;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlanResponse {
    String licensePlate;
    String planName;
    String planCode;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String note;
    Purpose purpose;
    String driverId;
    String driverName;
    List<AreaCode> allowedAreas;
    List<String> crewMembers;
    List<DetailVehicleWarehouseResponse> details;
}
