package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import lombok.*;

/**
 * Kết quả dự đoán từ các mô hình forecast
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastResult {
    private double forecastValue;
    private ForecastModel modelUsed;
    private double mape;             // Mean Absolute Percentage Error (%)
    private int dataPointsUsed;
    private String description;      // giải thích chi tiết cách tính
    private boolean requiresManualInput; // true nếu chưa đủ dữ liệu
    private boolean mapeWarning;     // true nếu MAPE > ngưỡng cảnh báo
    private String nextModelUpgrade; // thông tin để nâng cấp mô hình
    private double[] seasonalIndices; // hệ số mùa vụ (chỉ có ở SeasonalRegression)
}
