package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictedInventoryResponse {

    /** Tồn kho dự đoán tại targetDate. null nếu không tính được. */
    private BigDecimal predictedInventory;

    /** Ngày bắt đầu kế hoạch mới được đề xuất (sau lô hàng đang bay nếu có). */
    private LocalDate suggestedStartDate;

    /** Thông báo giải thích cho người dùng. */
    private String message;

    /** Danh sách lô hàng đang bay (đã đặt, chưa nhận). */
    private List<PendingReceipt> pendingReceipts;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PendingReceipt {
        private LocalDate  orderDate;
        private LocalDate  expectedDeliveryDate;
        private BigDecimal quantity;
    }
}
