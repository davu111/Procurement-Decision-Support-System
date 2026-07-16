package com.ecotel.inventory_optimization_service.dto.response.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO cho Supply Status Dashboard.
 *
 * Trả lời câu hỏi: "Sản phẩm nào sắp hết hàng, tôi có kịp đặt không?"
 *
 * Chỉ số cốt lõi:
 *   daysOfSupply         — DOS_raw = currentInventory / dailyConsumption
 *   daysOfSupplyEffective — DOS_eff = (currentInventory + pendingQty) / dailyConsumption
 *
 * Status (dùng DOS_raw để tránh che khuất rủi ro khi lô đang bay bị delay):
 *   CRITICAL — DOS_raw < committedLeadTimeDays                (không kịp kể cả đặt ngay hôm nay)
 *   WARNING  — DOS_raw < committedLeadTimeDays * 1.5          (sắp tới ngưỡng)
 *   OK       — an toàn
 *
 * processAlert:
 *   true = currentInventory < reorderPointB VÀ không có pending receipt nào
 *   → sản phẩm đã dưới điểm đặt hàng nhưng chưa ai đặt — lỗi quy trình cần xử lý ngay.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupplyStatusResponse {

    private String productId;
    private String productName;

    /** Tồn kho hiện tại (từ warehouse-service real-time hoặc mô phỏng nếu warehouse-service không sẵn sàng) */
    private BigDecimal currentInventory;

    /** Nguồn tồn kho: WAREHOUSE | SIMULATED */
    private String inventorySource;

    /** @deprecated Không còn sử dụng sau khi chuyển sang warehouse-service real-time */
    @Deprecated
    private LocalDate lastStockCountDate;

    /** Tiêu thụ hàng ngày = demandQ / 30 */
    private BigDecimal dailyConsumption;

    /**
     * Days of Supply thô — chỉ dùng tồn kho hiện tại, không tính lô đang về.
     * Dùng để tính status vì nếu lô đang về bị delay thì vẫn nguy hiểm.
     * Null nếu dailyConsumption = 0.
     */
    private BigDecimal daysOfSupply;

    /**
     * Days of Supply hiệu dụng — cộng thêm số lượng lô đang về.
     * Hiển thị thêm để người dùng tự đánh giá. Null nếu dailyConsumption = 0.
     */
    private BigDecimal daysOfSupplyEffective;

    /** Lead time cam kết của NCC (ngày) = snapshotLeadTimeL * 30 */
    private BigDecimal committedLeadTimeDays;

    /** CRITICAL | WARNING | OK */
    private String status;

    /** Các lô hàng đang trên đường về */
    private List<PendingReceiptDto> pendingReceipts;

    /** Ngày đặt hàng tiếp theo trong lịch (> today, hiệu lực) */
    private LocalDate nextScheduledOrderDate;

    /**
     * true = tồn kho đã dưới điểm đặt hàng B nhưng KHÔNG có pending receipt nào.
     * Đây là lỗi quy trình: đã đến lúc đặt hàng nhưng chưa ai đặt.
     */
    private boolean processAlert;

    // ──────────────────────────────────────────────────────────────────────
    // Inner DTO
    // ──────────────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PendingReceiptDto {

        /** Ngày dự kiến nhận hàng */
        private LocalDate expectedDeliveryDate;

        /** Số lượng đặt mua trong đơn này */
        private BigDecimal quantity;

        /**
         * true = đơn này đã trễ (actualDeliveryDate IS NULL AND expectedDeliveryDate < today).
         * Người dùng cần gọi NCC để xác nhận.
         */
        private boolean isDelayed;
    }
}
