package com.ecotel.inventory_optimization_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phiếu kiểm kê kho — ghi nhận số lượng thực tế tại một thời điểm.
 * Đây là "điểm neo" thực tế dùng thay cho mô phỏng khi replan / lập kế hoạch mới.
 *
 * Vòng đời:
 *   DRAFT     → Phiếu vừa tạo, systemQuantity đã tính tự động
 *   CONFIRMED → Người kiểm kê đã nhập actualQuantity, variance đã chốt, không sửa được nữa
 */
@Entity
@Table(name = "stock_counts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "count_date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockCount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** productId — khóa ngoài logic sang product-service (không FK thật vì microservice) */
    @Column(name = "product_id", nullable = false)
    private String productId;

    /** Ngày kiểm kê — nên là ngày cuối tháng (frontend gợi ý) */
    @Column(name = "count_date", nullable = false)
    private LocalDate countDate;

    /**
     * Số lượng tồn kho theo hệ thống (mô phỏng tại countDate).
     * Tự động tính khi tạo phiếu DRAFT qua simulateInventoryAt().
     */
    @Column(name = "system_quantity", precision = 18, scale = 4, nullable = false)
    private BigDecimal systemQuantity;

    /**
     * Số lượng thực tế đếm được.
     * null cho đến khi người kiểm kê xác nhận (CONFIRMED).
     */
    @Column(name = "actual_quantity", precision = 18, scale = 4)
    private BigDecimal actualQuantity;

    /** varianceQty = actual - system (âm = thất thoát/hao hụt) */
    @Column(name = "variance_qty", precision = 18, scale = 4)
    private BigDecimal varianceQty;

    /** varianceRate = varianceQty / systemQuantity — tỷ lệ chênh lệch */
    @Column(name = "variance_rate", precision = 8, scale = 4)
    private BigDecimal varianceRate;

    /** varianceValue = varianceQty * đơn giá — giá trị chênh lệch (VND) */
    @Column(name = "variance_value", precision = 18, scale = 4)
    private BigDecimal varianceValue;

    /** Người thực hiện kiểm kê */
    @Column(name = "counted_by", length = 100)
    private String countedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** DRAFT | CONFIRMED */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
