package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastPoint;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Giai đoạn 2: Holt-Winters Exponential Smoothing (Triple Exponential Smoothing)
 * Dùng khi có 6–18 điểm dữ liệu
 * Xử lý cả: Level (mức nền) + Trend (xu hướng) + Seasonality (mùa vụ)
 *
 * Công thức:
 *   Level:   L(t) = α*(y(t)/S(t-m)) + (1-α)*(L(t-1) + T(t-1))
 *   Trend:   T(t) = β*(L(t) - L(t-1)) + (1-β)*T(t-1)
 *   Season:  S(t) = γ*(y(t)/L(t)) + (1-γ)*S(t-m)
 *   Forecast: F(t+h) = (L(t) + h*T(t)) * S(t-m+h)
 */
@Component
public class HoltWintersForecast implements ForecastStrategy {

    @Value("${app.inventory.holt-winters.alpha:0.3}") private double alpha;
    @Value("${app.inventory.holt-winters.beta:0.1}")  private double beta;
    @Value("${app.inventory.holt-winters.gamma:0.2}") private double gamma;
    @Value("${app.inventory.holt-winters.season-length:12}") private int seasonLength;

    @Override
    public ForecastResult forecast(List<Double> historicalData,
                                   LocalDate lastPeriodStart,
                                   int periodsAhead,
                                   String planningUnit) {
        int n = historicalData.size();

        if (n < seasonLength) {
            // Fallback: chưa đủ 1 chu kỳ
            double avg = simpleAverage(historicalData);
            List<ForecastPoint> pts = new ArrayList<>();
            for (int step = 0; step < periodsAhead; step++) {
                String period = stepToPeriodLabel(lastPeriodStart, step + 1, planningUnit);
                pts.add(ForecastPoint.builder()
                        .period(period).forecastValue(avg)
                        .upperBound(avg * 1.15).lowerBound(avg * 0.85)
                        .build());
            }
            return ForecastResult.builder()
                    .forecastValue(avg).forecastPoints(pts)
                    .modelUsed(ForecastModel.HOLT_WINTERS).mape(Double.NaN)
                    .dataPointsUsed(n)
                    .description("Holt-Winters fallback: chưa đủ " + seasonLength + " điểm")
                    .build();
        }

        double[] data = historicalData.stream().mapToDouble(Double::doubleValue).toArray();
        double[] level = new double[n];
        double[] trend = new double[n];
        double[] seasonal = new double[n + periodsAhead]; // extend để forecast
        double[] forecastArr = new double[n];

        initializeComponents(data, level, trend, seasonal);

        for (int t = seasonLength; t < n; t++) {
            double prevL = level[t-1], prevT = trend[t-1], prevS = seasonal[t-seasonLength];
            level[t]    = alpha * (data[t] / prevS) + (1-alpha) * (prevL + prevT);
            trend[t]    = beta  * (level[t] - prevL) + (1-beta)  * prevT;
            seasonal[t] = gamma * (data[t] / level[t]) + (1-gamma) * prevS;
            forecastArr[t] = (prevL + prevT) * prevS;
        }

        double mape = calculateMape(data, forecastArr, seasonLength);

        double lastL = level[n-1];
        double lastT = trend[n-1];

        // Forecast h kỳ tiếp theo: F(n+h) = (L + h*T) * S(n-m + (n+h)%m)
        List<ForecastPoint> forecastPoints = new ArrayList<>();
        double firstForecastValue = 0;

        for (int step = 0; step < periodsAhead; step++) {
            int h = step + 1;
            int seasonIdx = (n + step) % seasonLength;
            double nextS = seasonal[n - seasonLength + seasonIdx];
            double fv = Math.max((lastL + h * lastT) * nextS, 0);

            if (step == 0) firstForecastValue = fv;

            double band = Double.isNaN(mape) ? fv * 0.1 : fv * (mape / 100.0);
            String period = stepToPeriodLabel(lastPeriodStart, h, planningUnit);

            forecastPoints.add(ForecastPoint.builder()
                    .period(period)
                    .forecastValue(Math.round(fv * 10000.0) / 10000.0)
                    .upperBound(Math.round((fv + band) * 10000.0) / 10000.0)
                    .lowerBound(Math.round(Math.max(0, fv - band) * 10000.0) / 10000.0)
                    .build());
        }

        return ForecastResult.builder()
                .forecastValue(firstForecastValue)
                .forecastPoints(forecastPoints)
                .modelUsed(ForecastModel.HOLT_WINTERS).mape(mape)
                .dataPointsUsed(n)
                .description(String.format(
                        "Holt-Winters (α=%.2f,β=%.2f,γ=%.2f,m=%d): L=%.4f,T=%.4f → kỳ1=%.4f",
                        alpha, beta, gamma, seasonLength, lastL, lastT, firstForecastValue))
                .build();
    }

    private void initializeComponents(double[] data, double[] level, double[] trend, double[] seasonal) {
        double initialLevel = 0;
        for (int i = 0; i < seasonLength; i++) initialLevel += data[i];
        initialLevel /= seasonLength;

        double initialTrend = 0;
        if (data.length >= 2 * seasonLength) {
            double secondAvg = 0;
            for (int i = seasonLength; i < 2*seasonLength; i++) secondAvg += data[i];
            secondAvg /= seasonLength;
            initialTrend = (secondAvg - initialLevel) / seasonLength;
        }
        for (int i = 0; i < seasonLength; i++) {
            seasonal[i] = data[i] / initialLevel;
            level[i] = initialLevel;
            trend[i] = initialTrend;
        }
    }

    private double calculateMape(double[] actual, double[] forecast, int startFrom) {
        double total = 0; int count = 0;
        for (int i = startFrom; i < actual.length; i++) {
            if (actual[i] != 0 && forecast[i] != 0) {
                total += Math.abs((actual[i] - forecast[i]) / actual[i]);
                count++;
            }
        }
        return count > 0 ? (total / count) * 100 : Double.NaN;
    }

    private double simpleAverage(List<Double> data) {
        return data.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private String stepToPeriodLabel(LocalDate last, int steps, String planningUnit) {
        LocalDate next = switch (planningUnit.toUpperCase()) {
            case "QUARTER" -> last.plusMonths(3L * steps);
            case "YEAR"    -> last.plusYears(steps);
            default        -> last.plusMonths(steps);
        };
        return String.format("%d-%02d", next.getYear(), next.getMonthValue());
    }

    @Override
    public ForecastModel getModelType() { return ForecastModel.HOLT_WINTERS; }
}
