package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO response cho phiếu kiểm kê kho.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockCountResponse {

    private Long   id;
    private String productId;
    private LocalDate countDate;

    /** Số lượng theo hệ thống (mô phỏng) tại countDate */
    private BigDecimal systemQuantity;

    /** Số lượng thực tế (null khi DRAFT) */
    private BigDecimal actualQuantity;

    /** = actual - system (âm = thất thoát) */
    private BigDecimal varianceQty;

    /** = varianceQty / systemQuantity */
    private BigDecimal varianceRate;

    /** = varianceQty * đơn giá (VND) */
    private BigDecimal varianceValue;

    private String countedBy;
    private String notes;

    /** DRAFT | CONFIRMED */
    private String status;

    /** true nếu |varianceRate| > 5% và actual < system */
    private Boolean lossWarning;

    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
}
