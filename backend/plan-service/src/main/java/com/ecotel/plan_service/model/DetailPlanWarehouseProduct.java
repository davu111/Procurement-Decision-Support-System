package com.ecotel.plan_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouseProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String detailPlanWarehouseId;
    String productId;

    @Column(nullable = false)
    @Builder.Default
    BigDecimal plannedQuantity = BigDecimal.ZERO;
    @Column(nullable = false)
    @Builder.Default
    BigDecimal actualQuantity = BigDecimal.ZERO;
}
