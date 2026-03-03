package com.ecotel.plan_service.dto.response.vehicle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailWarehouseProductResponse {
    String warehouseId;
    String warehouseName;
    Map<String, BigDecimal> productQuantities;
}
