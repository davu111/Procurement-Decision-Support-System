package com.ecotel.plan_service.dto.request;

import com.ecotel.plan_service.enums.WorkType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanRequest {
    String vehiclePlanId;
    WorkType workType;
    Integer sequenceOrder;
    List<DetailPlanWarehouseRequest> warehouses;
}
