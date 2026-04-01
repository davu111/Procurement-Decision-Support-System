package com.ecotel.inventory_optimization_service.model;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_config_id")
    private WarehouseConfig warehouseConfig;

    // External reference sang Supplier Service (không có FK thật)
    @Column(name = "supplier_product_id")
    private UUID supplierProductId;

    @Enumerated(EnumType.STRING)
    @Column(name = "planning_unit", nullable = false)
    private PlanningUnit planningUnit;

    @Column(name = "plan_start_date", nullable = false)
    private LocalDate planStartDate;        // Ngày đầu kỳ — DB key, luôn là ngày 1 của kỳ

    @Column(name = "schedule_start_date")
    private LocalDate scheduleStartDate;    // Ngày bắt đầu sinh lịch — hôm nay hoặc đầu kỳ tương lai

    // Q - người dùng nhập hoặc AI đề xuất
    @Column(name = "demand_q", nullable = false, precision = 18, scale = 4)
    private BigDecimal demandQ;

    // I - hệ số bảo quản (đã quy đổi về đơn vị kỳ)
    @Column(name = "storage_cost_coefficient_i", nullable = false, precision = 8, scale = 4)
    private BigDecimal storageCostCoefficientI;

    // === Snapshot từ Supplier Service tại thời điểm tạo kỳ ===
    // Đã quy đổi về đơn vị planning_unit, bất biến sau khi lưu

    @Column(name = "snapshot_supply_rate_k", nullable = false, precision = 18, scale = 4)
    private BigDecimal snapshotSupplyRateK;         // K

    @Column(name = "snapshot_fixed_order_cost_a", nullable = false, precision = 18, scale = 4)
    private BigDecimal snapshotFixedOrderCostA;     // A

    @Column(name = "snapshot_unit_price_c", nullable = false, precision = 18, scale = 4)
    private BigDecimal snapshotUnitPriceC;          // C

    @Column(name = "snapshot_lead_time_l", nullable = false, precision = 8, scale = 4)
    private BigDecimal snapshotLeadTimeL;           // L

    // Nguồn dữ liệu snapshot: SUPPLIER_SERVICE | PREVIOUS_PERIOD | MANUAL
    @Column(name = "supplier_data_source", nullable = false, length = 30)
    @Builder.Default
    private String supplierDataSource = "MANUAL";

    // === Cờ đề xuất tự động ===
    @Column(name = "q_is_suggested")
    @Builder.Default
    private Boolean qIsSuggested = false;

    @Column(name = "suggestion_model", length = 50)
    private String suggestionModel;

    @Column(name = "suggestion_mape", precision = 8, scale = 4)
    private BigDecimal suggestionMape;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToOne(mappedBy = "inventoryParameter", cascade = CascadeType.ALL)
    private InventoryResult inventoryResult;
}
