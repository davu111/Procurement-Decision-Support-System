package com.ecotel.inventory_optimization_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mặt hàng dự trữ
 */
@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // mã mặt hàng

    @Column(nullable = false, length = 200)
    private String name; // tên mặt hàng

    @Column(length = 50)
    private String unit; // đơn vị tính (tấn, kg, thùng...)

    @Column(length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<InventoryParameter> inventoryParameters;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ConsumptionHistory> consumptionHistories;
}

