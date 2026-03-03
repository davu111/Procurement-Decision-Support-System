package com.ecotel.camera_service.dto.response.vehicle_plan;

import com.ecotel.camera_service.enums.WorkType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailVehicleWarehouseResponse {
    WorkType workType;
    Integer sequenceOrder;
    List<DetailWarehouseProductResponse> warehouseProducts;
}
