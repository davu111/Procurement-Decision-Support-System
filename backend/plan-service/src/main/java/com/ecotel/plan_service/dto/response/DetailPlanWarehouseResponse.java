package com.ecotel.plan_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouseResponse {
    String id;
    String detailPlanId;
    String warehouseId;
    String warehouseName;
    Integer visitOrder;
    List<DetailPlanWarehouseProductResponse> products;
}
