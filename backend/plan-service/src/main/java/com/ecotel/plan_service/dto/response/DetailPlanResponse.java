package com.ecotel.plan_service.dto.response;

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
public class DetailPlanResponse {
    String id;
    String vehiclePlanId;
    WorkType workType;
    Integer sequenceOrder;
    List<DetailPlanWarehouseResponse> warehouses;
}
