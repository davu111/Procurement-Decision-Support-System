package com.ecotel.vehicle_service.model;

import com.ecotel.vehicle_service.enums.VehicleState;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle", indexes = {
        @Index(name = "idx_license_plate", columnList = "license_plate"),
        @Index(name = "idx_vehicle_type_id", columnList = "vehicle_type_id"),
        @Index(name = "idx_current_state", columnList = "current_state"),
        @Index(name = "idx_in_warehouse_flag", columnList = "in_warehouse_flag")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    @Column(name = "vehicle_name", nullable = false, length = 100)
    String vehicleName;

    @Column(name = "license_plate", nullable = false, unique = true, length = 20)
    String licensePlate;

    @Column(nullable = false, unique = true, length = 45)
    String siteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_type_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicle_type"))
    @ToString.Exclude
    VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 2)
    @Builder.Default
    VehicleState currentState = VehicleState.S0;

    @Column(name = "current_plan_id", length = 45)
    String currentPlanId;

    @Column(name = "current_location", length = 100)
    @Builder.Default
    String currentLocation = "Ngoài kho";

    @Column(name = "in_warehouse_flag", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Builder.Default
    Boolean inWarehouseFlag = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
