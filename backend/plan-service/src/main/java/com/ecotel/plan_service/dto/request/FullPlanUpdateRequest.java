package com.ecotel.plan_service.dto.request;

import com.ecotel.plan_service.enums.PlanStatus;
import com.ecotel.plan_service.enums.Purpose;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FullPlanUpdateRequest {
    String id;
    String name;
    String licensePlate;
    Purpose purpose;
    String permittedArea;
    PlanStatus status;
    String memberId;
    List<String> crewMemberIds;
    List<PlanDetailUpdateRequest> planDetailRequests;
    LocalDate startDate;
    LocalDate dueDate;
}
