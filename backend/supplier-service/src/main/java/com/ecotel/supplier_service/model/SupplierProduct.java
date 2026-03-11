package com.ecotel.supplier_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "supplier_product",
        uniqueConstraints = @UniqueConstraint(columnNames = {"supplier_id", "product_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    // product_id là external reference sang Inventory Service - không có FK thật
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "max_supply_per_month", nullable = false, precision = 18, scale = 4)
    private BigDecimal maxSupplyPerMonth;   // K - năng lực cung cấp tối đa/tháng

    @Column(name = "fixed_order_cost", nullable = false, precision = 18, scale = 4)
    private BigDecimal fixedOrderCost;      // A - chi phí cố định mỗi lần đặt

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 4)
    private BigDecimal unitPrice;           // C - đơn giá mua

    @Column(name = "committed_lead_time_days", nullable = false)
    private Integer committedLeadTimeDays;  // L - lead time cam kết (ngày)

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
