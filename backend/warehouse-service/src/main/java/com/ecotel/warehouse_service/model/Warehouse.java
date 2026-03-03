package com.ecotel.warehouse_service.model;

import com.ecotel.warehouse_service.enums.AreaCode;
import com.ecotel.warehouse_service.enums.WarehouseStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Warehouse {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    String id;
    String warehouseName;
    @Enumerated(EnumType.STRING)
    AreaCode areaCode;
    String location;

    @Column(name = "site_id", nullable = false, length = 45)
    String siteId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    WarehouseStatus status = WarehouseStatus.ACTIVE;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
