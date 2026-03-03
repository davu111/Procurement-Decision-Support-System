package com.ecotel.plan_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DetailPlanWarehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String detailPlanId;
    String warehouseId;
    @Column(nullable = false)
    @Builder.Default
    Integer visitOrder = 1;
}
