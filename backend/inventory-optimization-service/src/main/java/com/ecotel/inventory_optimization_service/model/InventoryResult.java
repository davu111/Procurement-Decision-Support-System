package com.ecotel.inventory_optimization_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Kết quả tính toán tối ưu theo mô hình bổ sung dần
 */
@Entity
@Table(name = "inventory_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_parameter_id", nullable = false, unique = true)
    private InventoryParameter inventoryParameter;

    // === Kết quả tối ưu ===

    @Column(name = "optimal_order_qty_s", nullable = false, precision = 18, scale = 4)
    private BigDecimal optimalOrderQtyS; // S* - lượng đặt hàng tối ưu mỗi lần

    @Column(name = "optimal_order_count_n", nullable = false, precision = 10, scale = 4)
    private BigDecimal optimalOrderCountN; // n* - số lần đặt hàng tối ưu

    @Column(name = "optimal_cycle_time_tau", nullable = false, precision = 10, scale = 6)
    private BigDecimal optimalCycleTimeTau; // τ* - khoảng thời gian giữa 2 lần đặt hàng (theo kỳ)

    @Column(name = "max_inventory_level", nullable = false, precision = 18, scale = 4)
    private BigDecimal maxInventoryLevel; // S*(1 - Q/K) - lượng dự trữ tối đa

    @Column(name = "avg_inventory_level", nullable = false, precision = 18, scale = 4)
    private BigDecimal avgInventoryLevel; // Z = S*(1-Q/K)/2 - dự trữ trung bình

    @Column(name = "reorder_point_b", nullable = false, precision = 18, scale = 4)
    private BigDecimal reorderPointB; // B = Q*L - m*S* - điểm đặt hàng

    @Column(name = "min_total_cost", nullable = false, precision = 18, scale = 4)
    private BigDecimal minTotalCost; // D_min = 2*A*n* - chi phí tối ưu (không gồm mua hàng)

    @Column(name = "total_cost_with_purchase", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalCostWithPurchase; // D_min + C*Q - tổng chi phí gồm mua hàng

    @Column(name = "replenishment_time_tn", nullable = false, precision = 10, scale = 6)
    private BigDecimal replenishmentTimeTn; // Tn = S*/K - thời gian bổ sung một lô

    @Column(name = "m_value", nullable = false)
    private Integer mValue; // m = floor(L/τ*)

    // Cascade xóa order_schedules khi xóa inventory_result
    @JsonIgnore
    @OneToMany(mappedBy = "inventoryResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderSchedule> orderSchedules;

    @CreationTimestamp
    @Column(name = "calculated_at", updatable = false)
    private LocalDateTime calculatedAt;
}