package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Kết quả phân tích tỷ lệ thất thoát kho.
 * Phụ thuộc dữ liệu từ StockCount CONFIRMED (Module A).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LossRateAnalysisResponse {

    private String    productId;
    private LocalDate fromDate;
    private LocalDate toDate;

    /** Số phiếu CONFIRMED đã dùng để tính */
    private int stockCountsUsed;

    /**
     * Tỷ lệ thất thoát trung bình trong kỳ phân tích.
     * = Σ |varianceQty| (khi âm) / Σ systemQuantity
     */
    private BigDecimal avgLossRate;

    /** Tổng giá trị thất thoát (VND) — chỉ tính phần âm */
    private BigDecimal totalLossValue;

    /** spoilageRate đang cấu hình trong WarehouseConfig */
    private BigDecimal configuredSpoilageRate;

    /**
     * true nếu |varianceRate| > 5% ở lần kiểm kê GẦN NHẤT.
     * Ngưỡng đã chốt: > 5%.
     */
    private Boolean exceedsWarningThreshold;

    /**
     * true nếu avgLossRate lệch > 30% so với configuredSpoilageRate.
     * Đề xuất cập nhật spoilageRate trong WarehouseConfig.
     */
    private Boolean suggestUpdateSpoilageRate;

    /** Văn bản gợi ý hành động */
    private String message;

    /** Chi tiết từng phiếu kiểm kê trong kỳ */
    private List<StockCountSummary> details;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockCountSummary {
        private Long      stockCountId;
        private LocalDate countDate;
        private BigDecimal systemQuantity;
        private BigDecimal actualQuantity;
        private BigDecimal varianceQty;
        private BigDecimal varianceRate;
        private BigDecimal varianceValue;
        /** true nếu |rate| > 5% và âm */
        private Boolean lossWarning;
    }
}
