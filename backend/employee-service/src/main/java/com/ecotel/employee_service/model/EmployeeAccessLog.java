package com.ecotel.employee_service.model;

import com.ecotel.employee_service.enums.AccessDirection;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.Duration;

@Entity
@Table(name = "employee_access_log", indexes = {
        @Index(name = "idx_employee_id", columnList = "employee_id"),
        @Index(name = "idx_access_time", columnList = "access_time"),
        @Index(name = "idx_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_direction", columnList = "direction"),
        @Index(name = "idx_employee_time", columnList = "employee_id, access_time"),
        @Index(name = "idx_warehouse_time", columnList = "warehouse_id, access_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    // Quan hệ trong cùng service (Employee Service)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_access_employee"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    Employee employee;

    @Column(name = "access_time", nullable = false)
    @Builder.Default
    LocalDateTime accessTime = LocalDateTime.now();

    // Microservices: Chỉ lưu ID, không có quan hệ JPA với Warehouse
    @Column(name = "warehouse_id", nullable = false, length = 45)
    String warehouseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 3)
    AccessDirection direction;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    // Helper method để kiểm tra có phải vào kho không
    public boolean isCheckIn() {
        return direction == AccessDirection.IN;
    }

    // Helper method để kiểm tra có phải ra kho không
    public boolean isCheckOut() {
        return direction == AccessDirection.OUT;
    }

    // Helper method để lấy mô tả hướng
    public String getDirectionDescription() {
        return direction == AccessDirection.IN ? "Vào kho" : "Ra kho";
    }

    // Helper method để tính thời gian từ lúc access đến hiện tại
    public Duration getElapsedTime() {
        return Duration.between(accessTime, LocalDateTime.now());
    }

    // Helper method để format thời gian trôi qua
    public String getElapsedTimeFormatted() {
        Duration elapsed = getElapsedTime();
        long hours = elapsed.toHours();
        long minutes = elapsed.toMinutes() % 60;

        if (hours > 0) {
            return String.format("%d giờ %d phút trước", hours, minutes);
        } else if (minutes > 0) {
            return String.format("%d phút trước", minutes);
        } else {
            return "Vừa xong";
        }
    }
}
