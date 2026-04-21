package com.ecotel.inventory_optimization_service.model;

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
 * Tham số kế hoạch dự trữ cho một khoảng thời gian liên tục.
 * Không còn planningUnit — tất cả đều là kế hoạch theo tháng.
 * Một bản ghi bao phủ từ planStartDate đến planEndDate (nhiều tháng liền kề).
 * Q là nhu cầu mỗi tháng, thuật toán chạy 1 lần, lịch đặt hàng sinh xuyên suốt.
 */
@Entity
@Table(name = "inventory_parameters")
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

    // Ngày đầu kỳ — luôn là ngày 1 của tháng bắt đầu (DB key)
    @Column(name = "plan_start_date", nullable = false)
    private LocalDate planStartDate;

    // Ngày cuối kỳ — luôn là ngày cuối của tháng kết thúc
    @Column(name = "plan_end_date", nullable = false)
    private LocalDate planEndDate;

    // Ngày bắt đầu sinh lịch đặt hàng:
    //   kỳ hiện tại  → ngày hôm nay
    //   kỳ tương lai → planStartDate
    @Column(name = "schedule_start_date", nullable = false)
    private LocalDate scheduleStartDate;

    // Q — nhu cầu tiêu thụ MỖI THÁNG (không phải tổng cả kỳ)
    @Column(name = "demand_q", nullable = false, precision = 18, scale = 4)
    private BigDecimal demandQ;

    // I — hệ số bảo quản/tháng (I năm / 12)
    @Column(name = "storage_cost_coefficient_i", nullable = false, precision = 8, scale = 4)
    private BigDecimal storageCostCoefficientI;

    // Snapshot từ Supplier Service — K/tháng, A, C, L/tháng
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

    /**
     * Trạng thái kế hoạch:
     *   ACTIVE      — đang hiệu lực
     *   SUPERSEDED  — đã bị thay thế bởi kế hoạch mới (giữ lại làm audit trail)
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    /**
     * Tồn kho thực tế (hoặc dự đoán) tại thời điểm bắt đầu kế hoạch.
     * Dùng để tính ngày đặt hàng đầu tiên khi replan.
     * null = kế hoạch đầu tiên, bắt đầu từ B lý thuyết.
     */
    @Column(name = "initial_inventory", precision = 18, scale = 4)
    private BigDecimal initialInventory;

    /**
     * Lô hàng đang bay tại thời điểm replan (scheduled receipt).
     * Số lượng của đơn hàng đã đặt nhưng chưa nhận, sẽ về trong khoảng L_new.
     * null = không có lô hàng đang bay.
     */
    @Column(name = "scheduled_receipt_qty", precision = 18, scale = 4)
    private BigDecimal scheduledReceiptQty;

    /**
     * Ngày nhận lô hàng đang bay (scheduled receipt date).
     */
    @Column(name = "scheduled_receipt_date")
    private LocalDate scheduledReceiptDate;

    @Column(name = "param_receipt")
    private Long paramReceipt; // inventory_parameters.id của kế hoạch bị kế hoạch này ghì đè

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

    /**
     * Ngày đặt hàng thực tế đầu tiên trong kỳ kế hoạch
     * = min(order_date) từ OrderSchedules
     * Có thể khác planStartDate nếu bắt đầu lập kế hoạch muộn
     */
    @Column(name = "actual_first_order_date")
    private LocalDate actualFirstOrderDate;

    /**
     * Ngày kết thúc thực tế của kế hoạch
     * = max(expected_delivery_date + Tn + Tt) từ OrderSchedules
     * Có thể vượt qua planEndDate do lead time và thời gian sử dụng
     */
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;
}
