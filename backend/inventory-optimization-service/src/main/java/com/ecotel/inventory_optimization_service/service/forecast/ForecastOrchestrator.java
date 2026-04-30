package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
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

    private final WeightedMovingAverageForecast  wmaForecast;
    private final HoltWintersForecast            holtWintersForecast;
    private final SeasonalRegressionForecast     seasonalRegressionForecast;
    private final ConsumptionHistoryRepository   consumptionHistoryRepository;

    @Value("${app.inventory.wma-threshold:6}")
    private int wmaThreshold;

    @Value("${app.inventory.holt-winters-threshold:18}")
    private int holtWintersThreshold;

    @Value("${app.inventory.mape-warning-threshold:20.0}")
    private double mapeWarningThreshold;

    /**
     * Dự đoán Q (nhu cầu/tháng) cho các tháng tiếp theo.
     *
     * @param periodsAhead số tháng muốn dự đoán (mặc định 3)
     */
    public ForecastResult forecastDemand(String productId, int periodsAhead) {
        List<ConsumptionHistory> history =
                consumptionHistoryRepository.findByProductIdOrderByPeriodStartDateAsc(productId);

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

        LocalDate lastPeriodStart = history.get(history.size() - 1).getPeriodStartDate();

        ForecastResult result = selectStrategy(dataCount)
                .forecast(consumptionData, lastPeriodStart, periodsAhead);

        result.setMapeWarning(!Double.isNaN(result.getMape())
                && result.getMape() > mapeWarningThreshold);
        result.setNextModelUpgrade(getNextModelInfo(dataCount));

        return result;
    }

    /** Overload mặc định 3 tháng */
    public ForecastResult forecastDemand(String productId) {
        return forecastDemand(productId, 6);
    }

    /**
     * Dự đoán Lead Time (ngày) cho tháng tiếp theo.
     * Lead time ổn định theo thời gian → WMA là đủ.
     */
    public ForecastResult forecastLeadTime(String productId) {
        List<ConsumptionHistory> history =
                consumptionHistoryRepository.findByProductIdOrderByPeriodStartDateAsc(productId);

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

        LocalDate lastPeriodStart = history.isEmpty()
                ? LocalDate.now()
                : history.get(history.size() - 1).getPeriodStartDate();

        // Lead time dùng WMA, chỉ cần 1 kỳ dự đoán
        return wmaForecast.forecast(leadTimeData, lastPeriodStart, 1);
    }

    // -------------------------------------------------------

    public ForecastStrategy selectStrategy(int dataCount) {
        if (dataCount < wmaThreshold)         return wmaForecast;
        if (dataCount < holtWintersThreshold) return holtWintersForecast;
        return seasonalRegressionForecast;
    }

    public ForecastModel getCurrentModelType(int dataCount) {
        return selectStrategy(dataCount).getModelType();
    }

    private String getNextModelInfo(int count) {
        if (count < wmaThreshold)
            return "Cần thêm " + (wmaThreshold - count) + " tháng để nâng lên Holt-Winters";
        if (count < holtWintersThreshold)
            return "Cần thêm " + (holtWintersThreshold - count) + " tháng để nâng lên Seasonal Regression";
        return "Đang dùng mô hình tốt nhất: Seasonal Regression";
    }
}
