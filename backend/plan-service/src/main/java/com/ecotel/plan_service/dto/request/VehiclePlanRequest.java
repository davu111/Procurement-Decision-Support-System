package com.ecotel.plan_service.dto.request;

import com.ecotel.plan_service.enums.Purpose;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlanRequest {
    String planId;
    String licensePlate;
    Purpose purpose;
    String driverId;
    String driverName;
    List<VehiclePlanAreaRequest> allowedAreas;
    List<VehiclePlanCrewMemberRequest> crewMembers;
    List<DetailPlanRequest> detailPlans;
}
