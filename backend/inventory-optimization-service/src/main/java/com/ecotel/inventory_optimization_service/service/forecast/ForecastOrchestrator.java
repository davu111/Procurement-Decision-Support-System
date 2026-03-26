package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
     * Dự đoán Q cho nhiều kỳ tiếp theo.
     *
     * @param periodsAhead số kỳ muốn dự đoán (mặc định 3 cho frontend chart)
     */
    public ForecastResult forecastDemand(Long productId, PlanningUnit planningUnit,
                                         int periodsAhead) {
        List<ConsumptionHistory> history =
                consumptionHistoryRepository.findByProductIdAndPlanningUnitOrderByPeriodStartDateAsc(
                        productId, planningUnit);

        int dataCount = history.size();

        if (dataCount == 0) {
            return ForecastResult.builder()
                    .modelUsed(ForecastModel.MANUAL).dataPointsUsed(0)
                    .description("Chưa có dữ liệu lịch sử. Vui lòng nhập thủ công.")
                    .requiresManualInput(true)
                    .build();
        }

        List<Double> consumptionData = history.stream()
                .map(h -> h.getActualConsumption().doubleValue())
                .collect(Collectors.toList());

        // Ngày bắt đầu kỳ CUỐI CÙNG — để tính nhãn tháng cho forecast
        LocalDate lastPeriodStart = history.get(history.size() - 1).getPeriodStartDate();

        ForecastStrategy strategy = selectStrategy(dataCount);
        ForecastResult result = strategy.forecast(
                consumptionData, lastPeriodStart, periodsAhead, planningUnit.name());

        result.setMapeWarning(!Double.isNaN(result.getMape()) && result.getMape() > mapeWarningThreshold);
        result.setNextModelUpgrade(getNextModelInfo(dataCount));

        return result;
    }

    /** Overload backward-compat: mặc định 3 kỳ */
    public ForecastResult forecastDemand(Long productId, PlanningUnit planningUnit) {
        return forecastDemand(productId, planningUnit, 3);
    }

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
                    .modelUsed(ForecastModel.MANUAL).dataPointsUsed(0)
                    .description("Chưa có dữ liệu lead time. Vui lòng nhập thủ công.")
                    .requiresManualInput(true)
                    .build();
        }

        LocalDate lastPeriodStart = history.isEmpty() ? LocalDate.now()
                : history.get(history.size() - 1).getPeriodStartDate();

        // Lead time dùng WMA, chỉ cần 1 kỳ dự đoán
        return wmaForecast.forecast(leadTimeData, lastPeriodStart, 1, planningUnit.name());
    }

    public ForecastStrategy selectStrategy(int dataCount) {
        if (dataCount < wmaThreshold) return wmaForecast;
        if (dataCount < holtWintersThreshold) return holtWintersForecast;
        return seasonalRegressionForecast;
    }

    public ForecastModel getCurrentModelType(int dataCount) {
        return selectStrategy(dataCount).getModelType();
    }

    private String getNextModelInfo(int currentCount) {
        if (currentCount < wmaThreshold)
            return String.format("Cần thêm %d điểm để nâng lên Holt-Winters", wmaThreshold - currentCount);
        if (currentCount < holtWintersThreshold)
            return String.format("Cần thêm %d điểm để nâng lên Seasonal Regression", holtWintersThreshold - currentCount);
        return "Đang dùng mô hình tốt nhất: Seasonal Regression";
    }
}
