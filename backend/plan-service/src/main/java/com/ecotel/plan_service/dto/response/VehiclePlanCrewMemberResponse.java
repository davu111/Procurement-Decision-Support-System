package com.ecotel.plan_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlanCrewMemberResponse {
    Integer id;
    String vehiclePlanId;
    String crewMemberId;
    String crewMemberName;
}
