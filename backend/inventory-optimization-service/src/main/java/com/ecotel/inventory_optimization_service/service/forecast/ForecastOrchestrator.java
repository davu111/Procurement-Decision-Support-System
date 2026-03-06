package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrator - Tự động chọn mô hình dự đoán phù hợp dựa trên lượng dữ liệu
 *
 * Logic chọn mô hình:
 *   < WMA_THRESHOLD điểm     → WeightedMovingAverage
 *   WMA ~ HW_THRESHOLD điểm  → HoltWinters
 *   > HW_THRESHOLD điểm      → SeasonalRegression
 */
@Service
@RequiredArgsConstructor
public class ForecastOrchestrator {

    private final WeightedMovingAverageForecast wmaForecast;
    private final HoltWintersForecast holtWintersForecast;
    private final SeasonalRegressionForecast seasonalRegressionForecast;
    private final ConsumptionHistoryRepository consumptionHistoryRepository;

    @Value("${app.inventory.wma-threshold:6}")
    private int wmaThreshold;

    @Value("${app.inventory.holt-winters-threshold:18}")
    private int holtWintersThreshold;

    @Value("${app.inventory.mape-warning-threshold:20.0}")
    private double mapeWarningThreshold;

    /**
     * Dự đoán Q cho mặt hàng trong kỳ tiếp theo
     */
    public ForecastResult forecastDemand(Long productId, PlanningUnit planningUnit) {
        List<ConsumptionHistory> history =
                consumptionHistoryRepository.findByProductIdAndPlanningUnitOrderByPeriodStartDateAsc(
                        productId, planningUnit);

        int dataCount = history.size();

        if (dataCount == 0) {
            return ForecastResult.builder()
                    .modelUsed(ForecastModel.MANUAL)
                    .dataPointsUsed(0)
                    .description("Chưa có dữ liệu lịch sử. Vui lòng nhập thủ công.")
                    .requiresManualInput(true)
                    .build();
        }

        List<Double> consumptionData = history.stream()
                .map(h -> h.getActualConsumption().doubleValue())
                .collect(Collectors.toList());

        ForecastStrategy strategy = selectStrategy(dataCount);
        ForecastResult result = strategy.forecast(consumptionData);

        // Đánh giá và thêm cảnh báo nếu MAPE cao
        result.setMapeWarning(!Double.isNaN(result.getMape()) && result.getMape() > mapeWarningThreshold);
        result.setNextModelUpgrade(getNextModelInfo(dataCount));

        return result;
    }

    /**
     * Dự đoán Lead Time cho mặt hàng
     */
    public ForecastResult forecastLeadTime(Long productId, PlanningUnit planningUnit) {
        List<ConsumptionHistory> history =
                consumptionHistoryRepository.findByProductIdAndPlanningUnitOrderByPeriodStartDateAsc(
                        productId, planningUnit);

        List<Double> leadTimeData = history.stream()
                .filter(h -> h.getActualLeadTimeDays() != null)
                .map(h -> h.getActualLeadTimeDays().doubleValue())
                .collect(Collectors.toList());

        if (leadTimeData.isEmpty()) {
            return ForecastResult.builder()
                    .modelUsed(ForecastModel.MANUAL)
                    .dataPointsUsed(0)
                    .description("Chưa có dữ liệu lead time. Vui lòng nhập thủ công.")
                    .requiresManualInput(true)
                    .build();
        }

        // Lead time thường ổn định → dùng WMA là đủ
        return wmaForecast.forecast(leadTimeData);
    }

    /**
     * Chọn strategy dựa trên số điểm dữ liệu
     */
    public ForecastStrategy selectStrategy(int dataCount) {
        if (dataCount < wmaThreshold) return wmaForecast;
        if (dataCount < holtWintersThreshold) return holtWintersForecast;
        return seasonalRegressionForecast;
    }

    public ForecastModel getCurrentModelType(int dataCount) {
        return selectStrategy(dataCount).getModelType();
    }

    private String getNextModelInfo(int currentCount) {
        if (currentCount < wmaThreshold) {
            return String.format("Cần thêm %d điểm để nâng lên Holt-Winters (xử lý mùa vụ tốt hơn)",
                    wmaThreshold - currentCount);
        }
        if (currentCount < holtWintersThreshold) {
            return String.format("Cần thêm %d điểm để nâng lên Seasonal Regression (chính xác nhất)",
                    holtWintersThreshold - currentCount);
        }
        return "Đang dùng mô hình tốt nhất: Seasonal Regression";
    }
}
