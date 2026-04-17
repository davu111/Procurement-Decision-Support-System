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
     * Dự đoán nhiều tháng tiếp theo.
     * Tất cả đều là đơn vị tháng — không còn planningUnit.
     *
     * @param historicalData  chuỗi actual_consumption theo tháng, sort tăng dần
     * @param lastPeriodStart ngày bắt đầu tháng CUỐI CÙNG trong historicalData
     *                        — để tính nhãn YYYY-MM cho ForecastPoint
     * @param periodsAhead    số tháng muốn dự đoán (thường là 3)
     */
    ForecastResult forecast(List<Double> historicalData,
                            LocalDate lastPeriodStart,
                            int periodsAhead);

    ForecastModel getModelType();
}
