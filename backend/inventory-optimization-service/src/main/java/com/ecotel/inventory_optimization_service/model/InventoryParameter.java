package com.ecotel.inventory_optimization_service.model;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tham số dự trữ cho từng mặt hàng trong từng kỳ kế hoạch
 */
@Entity
@Table(name = "inventory_parameters",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "plan_start_date", "planning_unit"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_config_id")
    private WarehouseConfig warehouseConfig;

    // === Đơn vị thời gian ===
    @Enumerated(EnumType.STRING)
    @Column(name = "planning_unit", nullable = false)
    private PlanningUnit planningUnit; // MONTH / QUARTER / YEAR

    @Column(name = "plan_start_date", nullable = false)
    private LocalDate planStartDate; // ngày bắt đầu kỳ kế hoạch

    // === Tham số đầu vào (đã quy đổi về đơn vị planningUnit) ===

    @Column(name = "demand_q", nullable = false, precision = 18, scale = 4)
    private BigDecimal demandQ; // Q - nhu cầu tiêu thụ trong kỳ

    @Column(name = "supply_rate_k", nullable = false, precision = 18, scale = 4)
    private BigDecimal supplyRateK; // K - tốc độ bổ sung trong kỳ

    @Column(name = "fixed_order_cost_a", nullable = false, precision = 18, scale = 4)
    private BigDecimal fixedOrderCostA; // A - chi phí đặt hàng cố định mỗi lần

    @Column(name = "storage_cost_coefficient_i", nullable = false, precision = 8, scale = 4)
    private BigDecimal storageCostCoefficientI; // I - hệ số chi phí bảo quản (đã quy đổi về kỳ)

    @Column(name = "lead_time_l", nullable = false, precision = 8, scale = 4)
    private BigDecimal leadTimeL; // L - thời gian vận chuyển (cùng đơn vị với kỳ kế hoạch)

    // === Cờ đề xuất tự động ===
    @Column(name = "q_is_suggested")
    @Builder.Default
    private Boolean qIsSuggested = false; // true nếu Q do hệ thống đề xuất

    @Column(name = "l_is_suggested")
    @Builder.Default
    private Boolean lIsSuggested = false; // true nếu L do hệ thống đề xuất

    @Column(name = "suggestion_model", length = 50)
    private String suggestionModel; // mô hình đã dùng để đề xuất (WMA/HOLT_WINTERS/SEASONAL_REGRESSION)

    @Column(name = "suggestion_mape", precision = 8, scale = 4)
    private BigDecimal suggestionMape; // MAPE của lần đề xuất

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === Kết quả tính toán (lưu lại để tra cứu) ===
    @OneToOne(mappedBy = "inventoryParameter", cascade = CascadeType.ALL)
    private InventoryResult inventoryResult;
}
