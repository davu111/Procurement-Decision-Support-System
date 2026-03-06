package com.ecotel.inventory_optimization_service.service.forecast;


import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.stereotype.Component;

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

    private static final int SEASON_LENGTH = 12; // chu kỳ 12 tháng

    @Override
    public ForecastResult forecast(List<Double> historicalData) {
        int n = historicalData.size();
        double[] data = historicalData.stream().mapToDouble(Double::doubleValue).toArray();

        // Bước 1: Tính seasonal index
        double[] seasonalIndex = calculateSeasonalIndex(data);

        // Bước 2: Khử mùa vụ
        double[] deseasonalized = new double[n];
        for (int i = 0; i < n; i++) {
            int period = i % SEASON_LENGTH;
            deseasonalized[i] = seasonalIndex[period] != 0
                    ? data[i] / seasonalIndex[period]
                    : data[i];
        }

        // Bước 3: Linear Regression
        double[] regression = linearRegression(deseasonalized);
        double a = regression[0]; // intercept
        double b = regression[1]; // slope

        // Bước 4: Dự đoán
        int nextPeriod = n % SEASON_LENGTH;
        double trendValue = a + b * n;
        double forecastValue = trendValue * seasonalIndex[nextPeriod];
        forecastValue = Math.max(forecastValue, 0);

        // Tính MAPE
        double mape = calculateMape(data, deseasonalized, a, b, seasonalIndex);

        return ForecastResult.builder()
                .forecastValue(forecastValue)
                .modelUsed(ForecastModel.SEASONAL_REGRESSION)
                .mape(mape)
                .dataPointsUsed(n)
                .description(String.format(
                        "Seasonal Regression: Trend(t=%d)=%.4f×%.4f+%.4f, SI[%d]=%.4f → Dự đoán=%.4f",
                        n, b, (double) n, a, nextPeriod, seasonalIndex[nextPeriod], forecastValue))
                .seasonalIndices(seasonalIndex)
                .build();
    }

    /**
     * Tính hệ số mùa vụ cho từng kỳ trong chu kỳ
     */
    private double[] calculateSeasonalIndex(double[] data) {
        double overallAvg = 0;
        for (double v : data) overallAvg += v;
        overallAvg /= data.length;

        double[] periodSum = new double[SEASON_LENGTH];
        int[] periodCount = new int[SEASON_LENGTH];

        for (int i = 0; i < data.length; i++) {
            int period = i % SEASON_LENGTH;
            periodSum[period] += data[i];
            periodCount[period]++;
        }

        double[] seasonalIndex = new double[SEASON_LENGTH];
        for (int k = 0; k < SEASON_LENGTH; k++) {
            double periodAvg = periodCount[k] > 0 ? periodSum[k] / periodCount[k] : overallAvg;
            seasonalIndex[k] = overallAvg != 0 ? periodAvg / overallAvg : 1.0;
        }

        return seasonalIndex;
    }

    /**
     * Ordinary Least Squares Linear Regression
     * y = a + b*t,  t = 0, 1, 2, ...
     */
    private double[] linearRegression(double[] data) {
        int n = data.length;
        double sumT = 0, sumY = 0, sumTY = 0, sumT2 = 0;

        for (int t = 0; t < n; t++) {
            sumT += t;
            sumY += data[t];
            sumTY += t * data[t];
            sumT2 += (double) t * t;
        }

        double b = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
        double a = (sumY - b * sumT) / n;

        return new double[]{a, b};
    }

    private double calculateMape(double[] actual, double[] deseasonalized,
                                 double a, double b, double[] seasonalIndex) {
        double totalError = 0;
        int count = 0;
        int startFrom = Math.min(SEASON_LENGTH, actual.length / 3);

        for (int t = startFrom; t < actual.length; t++) {
            int period = t % SEASON_LENGTH;
            double predicted = (a + b * t) * seasonalIndex[period];
            if (actual[t] != 0) {
                totalError += Math.abs((actual[t] - predicted) / actual[t]);
                count++;
            }
        }
        return count > 0 ? (totalError / count) * 100 : Double.NaN;
    }

    @Override
    public ForecastModel getModelType() {
        return ForecastModel.SEASONAL_REGRESSION;
    }
}
