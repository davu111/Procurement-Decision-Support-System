package com.ecotel.warehouse_service.model;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warehouse_product",
                        columnNames = {"warehouse_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_product_id", columnList = "product_id"),
                @Index(name = "idx_quantity", columnList = "quantity"),
                @Index(name = "idx_last_updated", columnList = "last_updated")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 45, nullable = false, updatable = false)
    String id;

    // Quan hệ trong cùng service (Warehouse Service)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_inventory_warehouse"))
    @ToString.Exclude
    Warehouse warehouse;

    // Microservices: Chỉ lưu ID, không có quan hệ JPA với Product
    @Column(name = "product_id", nullable = false, length = 45)
    String productId;

    @Column(name = "quantity", nullable = false, precision = 15, scale = 3)
    @Builder.Default
    BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "unit")
    String unit;

    @UpdateTimestamp
    @Column(name = "last_updated", nullable = false)
    LocalDateTime lastUpdated;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    // Business methods

    /**
     * Tăng số lượng tồn kho (nhập hàng)
     */
    public void increaseQuantity(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        this.quantity = this.quantity.add(amount);
    }

    /**
     * Giảm số lượng tồn kho (xuất hàng)
     */
    public void decreaseQuantity(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        if (this.quantity.compareTo(amount) < 0) {
            throw new IllegalStateException(
                    String.format("Insufficient inventory. Current: %s, Requested: %s",
                            this.quantity, amount)
            );
        }
        this.quantity = this.quantity.subtract(amount);
    }

    /**
     * Kiểm tra còn đủ hàng không
     */
    public boolean hasEnoughStock(BigDecimal requiredAmount) {
        return this.quantity.compareTo(requiredAmount) >= 0;
    }

    /**
     * Kiểm tra hàng hết hay chưa
     */
    public boolean isOutOfStock() {
        return this.quantity.compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Kiểm tra hàng sắp hết (dưới ngưỡng)
     */
    public boolean isLowStock(BigDecimal threshold) {
        return this.quantity.compareTo(threshold) <= 0;
    }

    // Validation
    @PrePersist
    @PreUpdate
    private void validateQuantity() {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
    }
}
