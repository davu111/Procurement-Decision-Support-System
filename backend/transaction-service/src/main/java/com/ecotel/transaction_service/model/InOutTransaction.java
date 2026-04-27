package com.ecotel.transaction_service.model;

import com.ecotel.transaction_service.enums.TransactionStatus;
import com.ecotel.transaction_service.enums.WorkType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "inout_transaction", indexes = {
        @Index(name = "idx_transaction_code", columnList = "transaction_code"),
        @Index(name = "idx_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_transaction_type", columnList = "transaction_type"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_confirmed_at", columnList = "confirmed_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InOutTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    @Column(name = "transaction_code", nullable = false, unique = true, length = 50)
    String transactionCode;

    // Microservices: Chỉ lưu ID, không có quan hệ JPA
    @Column(name = "warehouse_id", nullable = false, length = 45)
    String warehouseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", nullable = false, length = 10)
    WorkType workType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    TransactionStatus status = TransactionStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    LocalDateTime confirmedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    // Quan hệ trong cùng service (Transaction Service)
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    Set<InOutDetail> details = new HashSet<>();
}
