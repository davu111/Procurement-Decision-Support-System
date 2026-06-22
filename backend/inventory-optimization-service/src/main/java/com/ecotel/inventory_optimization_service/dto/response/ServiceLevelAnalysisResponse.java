package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import java.time.LocalDate;

/**
 * Kết quả phân tích Service Level / Tỷ lệ chờ nhập hàng.
 * Tính on-the-fly, không lưu bảng riêng.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceLevelAnalysisResponse {

    private String    productId;
    private LocalDate fromDate;
    private LocalDate toDate;

    /** Tổng số chu kỳ đặt hàng trong khoảng phân tích */
    private int totalCycles;

    /**
     * Tỷ lệ chu kỳ có stockout (tồn kho chạm 0).
     * = số chu kỳ stockout / tổng chu kỳ
     */
    private double stockoutFrequency;

    /**
     * Service Level = 1 - stockoutFrequency.
     * Mục tiêu hệ thống: >= 95% (Z = 1.65)
     */
    private double serviceLevel;

    /** Số ngày stockout trung bình mỗi lần xảy ra */
    private double avgStockoutDuration;

    /** Số ngày trễ giao hàng trung bình (actual vs expected delivery) */
    private double avgDeliveryDelay;

    /** Tổng ngày stockout tích lũy trong khoảng phân tích */
    private long totalStockoutDays;

    /** Tổng ngày trễ tích lũy */
    private long totalDelayDays;

    /** Số chu kỳ có actualDeliveryDate đã cập nhật (để biết độ tin cậy dữ liệu) */
    private int cyclesWithActualDelivery;
}
