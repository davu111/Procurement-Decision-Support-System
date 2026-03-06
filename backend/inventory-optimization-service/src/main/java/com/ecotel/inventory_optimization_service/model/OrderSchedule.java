package com.ecotel.inventory_optimization_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lịch kế hoạch đặt hàng được sinh tự động từ kết quả tính toán
 */
@Entity
@Table(name = "order_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_result_id", nullable = false)
    private InventoryResult inventoryResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "order_sequence", nullable = false)
    private Integer orderSequence; // thứ tự lần đặt hàng (1, 2, 3...)

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate; // ngày đặt hàng

    @Column(name = "expected_delivery_date", nullable = false)
    private LocalDate expectedDeliveryDate; // ngày dự kiến nhận hàng

    @Column(name = "order_quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal orderQuantity; // S* - số lượng đặt mua

    @Column(name = "estimated_cost", nullable = false, precision = 18, scale = 4)
    private BigDecimal estimatedCost; // A + C*S* - chi phí ước tính lần đặt này

    @Column(name = "is_reorder_warning")
    @Builder.Default
    private Boolean isReorderWarning = false; // cảnh báo sắp đến điểm đặt hàng B

    @Column(name = "actual_order_date")
    private LocalDate actualOrderDate; // ngày thực tế đặt (cập nhật sau)

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate; // ngày thực tế nhận (cập nhật sau)

    @Column(name = "actual_quantity", precision = 18, scale = 4)
    private BigDecimal actualQuantity; // số lượng thực tế nhận (cập nhật sau)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
