package com.ecotel.plan_service.dto.request;

import com.ecotel.plan_service.enums.AreaCode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlanAreaRequest {
    AreaCode areaCode;
}
