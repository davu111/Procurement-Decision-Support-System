package com.ecotel.plan_service.dto.response.vehicle;

import com.ecotel.plan_service.enums.WorkType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailVehicleWarehouseResponse {
    WorkType workType;
    Integer sequenceOrder;
    List<DetailWarehouseProductResponse> warehouseProducts;
}
