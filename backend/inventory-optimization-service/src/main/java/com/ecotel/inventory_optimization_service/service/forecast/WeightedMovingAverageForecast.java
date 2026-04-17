package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastPoint;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Giai đoạn 1: Weighted Moving Average (WMA)
 * Dùng khi có < 6 điểm dữ liệu
 *
 * Công thức: Q = w1*Q(t-1) + w2*Q(t-2) + w3*Q(t-3)
 * Trọng số: kỳ gần nhất có trọng số cao nhất
 */
@Component
public class WeightedMovingAverageForecast implements ForecastStrategy {

    private static final double[] WEIGHTS_3 = {0.50, 0.30, 0.20};
    private static final double[] WEIGHTS_2 = {0.65, 0.35};
    private static final double[] WEIGHTS_1 = {1.00};

    @Override
    public ForecastResult forecast(List<Double> historicalData,
                                   LocalDate lastPeriodStart,
                                   int periodsAhead) {
        int n = historicalData.size();
        if (n == 0) throw new IllegalArgumentException("Không có dữ liệu lịch sử");

        double[] weights = selectWeights(n);
        double   mape    = calculateMape(historicalData, weights);

        List<Double>        window         = new ArrayList<>(historicalData);
        List<ForecastPoint> forecastPoints = new ArrayList<>();
        double firstForecastValue = 0;

        for (int step = 0; step < periodsAhead; step++) {
            double[] recent = getRecentData(window, weights.length);
            double fv = 0;
            for (int i = 0; i < weights.length; i++) fv += weights[i] * recent[i];
            fv = Math.max(fv, 0);

            if (step == 0) firstForecastValue = fv;

            double effectiveMape = Double.isNaN(mape) ? 15.0 : Math.max(mape, 5.0);
            double band   = fv * (effectiveMape / 100.0);
            String period = periodLabel(lastPeriodStart, step + 1);

            forecastPoints.add(ForecastPoint.builder()
                    .period(period)
                    .forecastValue(round4(fv))
                    .upperBound(round4(fv + band))
                    .lowerBound(round4(Math.max(0, fv - band)))
                    .build());

            window.add(fv); // sliding window cho kỳ tiếp
        }

        return ForecastResult.builder()
                .forecastValue(firstForecastValue)
                .forecastPoints(forecastPoints)
                .modelUsed(ForecastModel.WMA)
                .mape(mape)
                .dataPointsUsed(n)
                .description(buildDescription(weights,
                        getRecentData(historicalData, weights.length), firstForecastValue))
                .build();
    }

    // -------------------------------------------------------

    private double[] selectWeights(int n) {
        if (n >= 3) return WEIGHTS_3;
        if (n == 2) return WEIGHTS_2;
        return WEIGHTS_1;
    }

    private double[] getRecentData(List<Double> data, int count) {
        int size = data.size();
        double[] recent = new double[count];
        for (int i = 0; i < count; i++) recent[i] = data.get(size - 1 - i);
        return recent;
    }

    private double calculateMape(List<Double> data, double[] weights) {
        if (data.size() < weights.length + 1) return Double.NaN;
        double totalError = 0; int count = 0;
        for (int t = weights.length; t < data.size(); t++) {
            double predicted = 0;
            for (int i = 0; i < weights.length; i++) predicted += weights[i] * data.get(t - 1 - i);
            double actual = data.get(t);
            if (actual != 0) { totalError += Math.abs((actual - predicted) / actual); count++; }
        }
        return count > 0 ? (totalError / count) * 100 : Double.NaN;
    }

    private String buildDescription(double[] weights, double[] recent, double forecast) {
        StringBuilder sb = new StringBuilder("WMA: ");
        for (int i = 0; i < weights.length; i++) {
            sb.append(String.format("%.0f%%×%.2f", weights[i] * 100, recent[i]));
            if (i < weights.length - 1) sb.append(" + ");
        }
        sb.append(String.format(" = %.4f", forecast));
        return sb.toString();
    }

    /** Tính nhãn YYYY-MM cách lastPeriodStart một số tháng */
    private String periodLabel(LocalDate last, int monthsAhead) {
        LocalDate next = last.plusMonths(monthsAhead);
        return String.format("%d-%02d", next.getYear(), next.getMonthValue());
    }

    private double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    @Override
    public ForecastModel getModelType() { return ForecastModel.WMA; }
}
