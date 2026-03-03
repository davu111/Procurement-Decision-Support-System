package com.ecotel.warehouse_service.dto.response;

import com.ecotel.warehouse_service.model.Warehouse;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
    BigDecimal quantity;
    String unit;
    LocalDateTime lastUpdated;
}
