package com.ecotel.camera_service.dto.response;

import com.ecotel.camera_service.dto.response.vehicle_plan.VehiclePlanResponse;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class VehiclePlanResult extends ProcessingResult<VehiclePlanResponse> {
}