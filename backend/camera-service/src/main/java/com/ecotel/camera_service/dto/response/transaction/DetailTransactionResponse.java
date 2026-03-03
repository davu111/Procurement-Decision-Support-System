package com.ecotel.camera_service.dto.response.transaction;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailTransactionResponse {
    String productId;
    String productName;
    BigDecimal plannedQuantity;
    BigDecimal actualQuantity;
}
