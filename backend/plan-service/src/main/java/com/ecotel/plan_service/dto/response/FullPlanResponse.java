package com.ecotel.plan_service.dto.response;

import com.ecotel.plan_service.enums.PlanStatus;
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
public class FullPlanResponse {
    String id;
    String planName;
    String planCode;
    String color;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String note;
    PlanStatus planStatus;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    String createdBy;
    List<VehiclePlanResponse> vehiclePlans;
}
