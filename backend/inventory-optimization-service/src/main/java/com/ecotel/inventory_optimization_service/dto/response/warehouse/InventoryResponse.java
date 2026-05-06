package com.ecotel.warehouse_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryResponse {
    String id;
    String warehouseId;
    String productId;
    String productName;
    BigDecimal quantity;
    String unit;
    LocalDateTime lastUpdated;
}
