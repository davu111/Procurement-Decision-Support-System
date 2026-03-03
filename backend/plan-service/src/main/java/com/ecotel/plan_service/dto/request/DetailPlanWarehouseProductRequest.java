package com.ecotel.plan_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouseProductRequest {
    String detailPlanWarehouseId;
    String productId;
    BigDecimal plannedQuantity;
    BigDecimal actualQuantity;
}
