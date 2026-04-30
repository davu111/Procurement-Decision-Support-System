package com.ecotel.transaction_service.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReportDetail {
    String id;
    String productId;
    String productName;
    String productCode;
    String unit;
    BigDecimal price;
    BigDecimal plannedQuantity;
    BigDecimal actualQuantity;
}
