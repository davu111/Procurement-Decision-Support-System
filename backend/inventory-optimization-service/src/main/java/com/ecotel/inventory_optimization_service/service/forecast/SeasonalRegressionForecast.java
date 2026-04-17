package com.ecotel.inventory_optimization_service.service.forecast;


import com.ecotel.inventory_optimization_service.dto.response.ForecastPoint;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Giai đoạn 3: Seasonal Index + Linear Regression
 * Dùng khi có > 18 điểm dữ liệu
 *
 * Thuật toán:
 *   Bước 1: Tính hệ số mùa vụ SI(k) = TB tiêu thụ tháng k / TB tổng thể
 *   Bước 2: Khử mùa vụ: deseasonalized[i] = data[i] / SI(period_of_i)
 *   Bước 3: Linear Regression trên dữ liệu đã khử mùa vụ → y = a + b*t
 *   Bước 4: Dự đoán = (a + b*t_next) * SI(period_of_t_next)
 */
@Component
public class SeasonalRegressionForecast implements ForecastStrategy {

    private static final int SEASON_LENGTH = 12;

    @Override
    public ForecastResult forecast(List<Double> historicalData,
                                   LocalDate lastPeriodStart,
                                   int periodsAhead) {
        int      n    = historicalData.size();
        double[] data = historicalData.stream().mapToDouble(Double::doubleValue).toArray();

        double[] seasonalIndex  = calculateSeasonalIndex(data);
        double[] deseasonalized = new double[n];
        for (int i = 0; i < n; i++) {
            int period = i % SEASON_LENGTH;
            deseasonalized[i] = seasonalIndex[period] != 0
                    ? data[i] / seasonalIndex[period] : data[i];
        }

        double[] reg = linearRegression(deseasonalized);
        double a = reg[0], b = reg[1];
        double mape = calculateMape(data, a, b, seasonalIndex);

        List<ForecastPoint> forecastPoints    = new ArrayList<>();
        double              firstForecastValue = 0;

        for (int step = 0; step < periodsAhead; step++) {
            int    t           = n + step;
            int    periodIndex = t % SEASON_LENGTH;
            double fv          = Math.max((a + b * t) * seasonalIndex[periodIndex], 0);

            if (step == 0) firstForecastValue = fv;

            double effectiveMape = Double.isNaN(mape) ? 10.0 : Math.max(mape, 5.0);
            double band = fv * (effectiveMape / 100.0);

            forecastPoints.add(ForecastPoint.builder()
                    .period(periodLabel(lastPeriodStart, step + 1))
                    .forecastValue(round4(fv))
                    .upperBound(round4(fv + band))
                    .lowerBound(round4(Math.max(0, fv - band)))
                    .build());
        }

        return ForecastResult.builder()
                .forecastValue(firstForecastValue)
                .forecastPoints(forecastPoints)
                .modelUsed(ForecastModel.SEASONAL_REGRESSION)
                .mape(mape)
                .dataPointsUsed(n)
                .seasonalIndices(seasonalIndex)
                .description(String.format(
                        "Seasonal Regression: a=%.4f, b=%.4f, SI[%d]=%.4f → kỳ1=%.4f",
                        a, b, n % SEASON_LENGTH, seasonalIndex[n % SEASON_LENGTH],
                        firstForecastValue))
                .build();
    }

    // -------------------------------------------------------

    private double[] calculateSeasonalIndex(double[] data) {
        double overallAvg = 0;
        for (double v : data) overallAvg += v;
        overallAvg /= data.length;

        double[] periodSum   = new double[SEASON_LENGTH];
        int[]    periodCount = new int[SEASON_LENGTH];
        for (int i = 0; i < data.length; i++) {
            periodSum[i % SEASON_LENGTH]   += data[i];
            periodCount[i % SEASON_LENGTH] ++;
        }

        double[] si = new double[SEASON_LENGTH];
        for (int k = 0; k < SEASON_LENGTH; k++) {
            double avg = periodCount[k] > 0 ? periodSum[k] / periodCount[k] : overallAvg;
            si[k] = overallAvg != 0 ? avg / overallAvg : 1.0;
        }
        return si;
    }

    private double[] linearRegression(double[] data) {
        int    n    = data.length;
        double sumT = 0, sumY = 0, sumTY = 0, sumT2 = 0;
        for (int t = 0; t < n; t++) {
            sumT += t; sumY += data[t];
            sumTY += t * data[t]; sumT2 += (double) t * t;
        }
        double b = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
        double a = (sumY - b * sumT) / n;
        return new double[]{a, b};
    }

    private double calculateMape(double[] actual, double a, double b, double[] si) {
        int startFrom = Math.min(SEASON_LENGTH, actual.length / 3);
        double totalError = 0; int count = 0;
        for (int t = startFrom; t < actual.length; t++) {
            double predicted = (a + b * t) * si[t % SEASON_LENGTH];
            if (actual[t] != 0) {
                totalError += Math.abs((actual[t] - predicted) / actual[t]);
                count++;
            }
        }
        return count > 0 ? (totalError / count) * 100 : Double.NaN;
    }

    private String periodLabel(LocalDate last, int monthsAhead) {
        LocalDate next = last.plusMonths(monthsAhead);
        return String.format("%d-%02d", next.getYear(), next.getMonthValue());
    }

    private double round4(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }

    @Override
    public ForecastModel getModelType() { return ForecastModel.SEASONAL_REGRESSION; }
}
