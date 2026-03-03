package com.ecotel.plan_service.model;

import com.ecotel.plan_service.enums.PlanStatus;
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
@Table(name = "plan",
        indexes = {
                @Index(name = "idx_plan_name", columnList = "planName"),
                @Index(name = "idx_plan_code", columnList = "planCode"),
                @Index(name = "idx_status", columnList = "status"),
                @Index(name = "idx_start_date", columnList = "startDate"),
                @Index(name = "idx_end_date", columnList = "endDate")
        }
)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Plan {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    String id;
    String planName;
    String planCode;
    String color;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    PlanStatus planStatus = PlanStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    LocalDateTime updatedAt = LocalDateTime.now();

    String createdBy;
}
