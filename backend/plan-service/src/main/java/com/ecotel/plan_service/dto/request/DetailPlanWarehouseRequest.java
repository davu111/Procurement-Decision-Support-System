package com.ecotel.plan_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouseRequest {
    String detailPlanId;
    String warehouseId;
    Integer visitOrder;
    List<DetailPlanWarehouseProductRequest> products;
}
