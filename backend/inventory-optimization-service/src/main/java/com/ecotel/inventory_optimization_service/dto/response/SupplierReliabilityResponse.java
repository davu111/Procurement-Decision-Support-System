package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;

/**
 * Kết quả đánh giá độ tin cậy nhà cung cấp dựa trên lead time cam kết vs thực tế.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierReliabilityResponse {

    private String  productId;

    /** Lead time cam kết từ nhà cung cấp (ngày) */
    private Integer committedLeadTimeDays;

    /** Trung bình lead time thực tế (ngày) — tính từ N kỳ gần nhất */
    private Double  avgActualLeadTimeDays;

    /** Độ lệch chuẩn lead time thực tế (ngày) */
    private Double  stdDevLeadTimeDays;

    /**
     * Tỉ lệ lệch: (avgActual - committed) / committed
     * Dương = giao trễ hơn cam kết, âm = giao sớm hơn cam kết.
     */
    private Double  deviationRate;

    /**
     * Phân loại độ tin cậy:
     *   RELIABLE   — |deviationRate| <= 10% VÀ stdDev < 2 ngày
     *   MODERATE   — |deviationRate| <= 25%
     *   UNRELIABLE — |deviationRate| > 25% HOẶC stdDev >= 2 ngày
     */
    private String  reliabilityLevel;

    /** Số kỳ dữ liệu thực tế đã dùng để tính toán */
    private Integer dataPointsUsed;

    /** Văn bản gợi ý hành động cho người dùng */
    private String  recommendation;

    /** Forecast lead time từ WMA (ngày) — để so sánh với committed */
    private Double  forecastLeadTimeDays;
}
