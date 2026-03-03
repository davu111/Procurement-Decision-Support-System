package com.ecotel.plan_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouseProductResponse {
    String id;
    String detailPlanWarehouseId;
    String productId;
    String productName;
    BigDecimal plannedQuantity;
    BigDecimal actualQuantity;
}
