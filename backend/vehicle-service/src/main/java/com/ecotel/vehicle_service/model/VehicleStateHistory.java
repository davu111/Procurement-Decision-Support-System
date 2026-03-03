package com.ecotel.vehicle_service.model;

import com.ecotel.vehicle_service.enums.VehicleState;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_state_history", indexes = {
        @Index(name = "idx_vehicle_id", columnList = "vehicle_id"),
        @Index(name = "idx_state_code", columnList = "state_code"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_vehicle_timestamp", columnList = "vehicle_id, timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VehicleStateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    // Quan hệ trong cùng service (Vehicle Service)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_history_vehicle"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "state_code", nullable = false, length = 2)
    VehicleState stateCode;

    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    LocalDateTime timestamp = LocalDateTime.now();

    // Microservices: Chỉ lưu ID, không có quan hệ JPA với Warehouse
    @Column(name = "warehouse_id", length = 45)
    String warehouseId;

    @Column(name = "note", columnDefinition = "TEXT")
    String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    // Helper method để tạo mô tả trạng thái
    public String getStateDescription() {
        return switch (stateCode) {
            case S0 -> "Sẵn sàng / Chờ lệnh";
            case S1 -> "Đang di chuyển đến kho";
            case S2 -> "Đang xếp hàng";
            case S3 -> "Đang di chuyển giao hàng";
            case S4 -> "Đang dỡ hàng";
            case S5 -> "Đang quay về";
            case S6 -> "Đang bảo trì";
            case S7 -> "Hỏng hóc";
            case S8 -> "Đang nghỉ";
            case S9 -> "Ngoại tuyến";
        };
    }

    // Helper method để kiểm tra xem có đang ở kho không
    public boolean isAtWarehouse() {
        return warehouseId != null && !warehouseId.isEmpty();
    }

    // Helper method để tạo note mặc định nếu không có
    public String getNoteOrDefault() {
        if (note != null && !note.isEmpty()) {
            return note;
        }
        return getStateDescription();
    }
}
