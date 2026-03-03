package com.ecotel.transaction_service.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inout_detail",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_transaction_product",
                        columnNames = {"transaction_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_transaction_id", columnList = "transaction_id"),
                @Index(name = "idx_product_id", columnList = "product_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InOutDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    // Quan hệ trong cùng service (Transaction Service)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_detail_transaction"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    InOutTransaction transaction;

    // Microservices: Chỉ lưu ID, không có quan hệ JPA với Product
    @Column(name = "product_id", nullable = false, length = 45)
    String productId;

    @Column(name = "quantity", nullable = false, precision = 15, scale = 3)
    BigDecimal quantity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    // Helper method để validate quantity > 0
    @PrePersist
    @PreUpdate
    private void validateQuantity() {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
    }
}
