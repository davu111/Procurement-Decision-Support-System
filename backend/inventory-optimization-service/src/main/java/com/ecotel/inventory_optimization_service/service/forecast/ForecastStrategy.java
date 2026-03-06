package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;

import java.util.List;

/**
 * Interface chung cho tất cả mô hình dự đoán
 */
public interface ForecastStrategy {

    /**
     * Dự đoán giá trị kỳ tiếp theo
     * @param historicalData danh sách dữ liệu lịch sử theo thứ tự thời gian (cũ → mới)
     * @return kết quả dự đoán kèm thông tin mô hình
     */
    ForecastResult forecast(List<Double> historicalData);

    ForecastModel getModelType();
}
