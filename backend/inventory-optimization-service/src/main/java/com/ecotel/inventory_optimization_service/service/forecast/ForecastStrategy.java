package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;

import java.time.LocalDate;
import java.util.List;

/**
 * Interface chung cho tất cả mô hình dự đoán
 */
public interface ForecastStrategy {

    /**
     * Dự đoán nhiều kỳ tiếp theo.
     *
     * @param historicalData  chuỗi giá trị lịch sử (đã sort tăng dần theo thời gian)
     * @param lastPeriodStart ngày bắt đầu kỳ CUỐI CÙNG trong historicalData
     *                        — để tính đúng nhãn tháng cho từng ForecastPoint
     * @param periodsAhead    số kỳ muốn dự đoán (thường là 3)
     * @param planningUnit    MONTH | QUARTER | YEAR — để bước đúng kỳ
     */
    ForecastResult forecast(List<Double> historicalData,
                            LocalDate lastPeriodStart,
                            int periodsAhead,
                            String planningUnit);

    ForecastModel getModelType();
}
