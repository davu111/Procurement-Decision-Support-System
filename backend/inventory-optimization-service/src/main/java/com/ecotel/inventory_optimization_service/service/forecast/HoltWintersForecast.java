package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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

    @Value("${app.inventory.holt-winters.alpha:0.3}")
    private double alpha;

    @Value("${app.inventory.holt-winters.beta:0.1}")
    private double beta;

    @Value("${app.inventory.holt-winters.gamma:0.2}")
    private double gamma;

    @Value("${app.inventory.holt-winters.season-length:12}")
    private int seasonLength;

    @Override
    public ForecastResult forecast(List<Double> historicalData) {
        int n = historicalData.size();
        if (n < seasonLength) {
            // Chưa đủ 1 chu kỳ mùa vụ → fallback về WMA với cảnh báo
            return ForecastResult.builder()
                    .forecastValue(simpleAverage(historicalData))
                    .modelUsed(ForecastModel.HOLT_WINTERS)
                    .mape(Double.NaN)
                    .dataPointsUsed(n)
                    .description("Holt-Winters fallback: chưa đủ " + seasonLength + " điểm để học mùa vụ, dùng trung bình đơn giản")
                    .build();
        }

        double[] data = historicalData.stream().mapToDouble(Double::doubleValue).toArray();

        // Khởi tạo
        double[] level = new double[n];
        double[] trend = new double[n];
        double[] seasonal = new double[n];
        double[] forecast = new double[n];

        initializeComponents(data, level, trend, seasonal);

        // Huấn luyện
        for (int t = seasonLength; t < n; t++) {
            double prevLevel = level[t - 1];
            double prevTrend = trend[t - 1];
            double prevSeasonal = seasonal[t - seasonLength];

            level[t] = alpha * (data[t] / prevSeasonal) + (1 - alpha) * (prevLevel + prevTrend);
            trend[t] = beta * (level[t] - prevLevel) + (1 - beta) * prevTrend;
            seasonal[t] = gamma * (data[t] / level[t]) + (1 - gamma) * prevSeasonal;
            forecast[t] = (prevLevel + prevTrend) * prevSeasonal;
        }

        // Dự đoán kỳ tiếp theo (h=1)
        double lastLevel = level[n - 1];
        double lastTrend = trend[n - 1];
        // Lấy chỉ số mùa vụ tương ứng kỳ tiếp theo
        int seasonIndex = (n % seasonLength == 0) ? 0 : (n % seasonLength);
        double nextSeasonal = seasonal[n - seasonLength + seasonIndex];

        double forecastValue = (lastLevel + lastTrend) * nextSeasonal;
        forecastValue = Math.max(forecastValue, 0); // không âm

        double mape = calculateMape(data, forecast, seasonLength);

        return ForecastResult.builder()
                .forecastValue(forecastValue)
                .modelUsed(ForecastModel.HOLT_WINTERS)
                .mape(mape)
                .dataPointsUsed(n)
                .description(String.format(
                        "Holt-Winters (α=%.2f, β=%.2f, γ=%.2f, m=%d): Level=%.4f, Trend=%.4f, Seasonal=%.4f → Dự đoán=%.4f",
                        alpha, beta, gamma, seasonLength, lastLevel, lastTrend, nextSeasonal, forecastValue))
                .build();
    }

    /**
     * Khởi tạo Level, Trend, Seasonal từ chu kỳ đầu tiên
     */
    private void initializeComponents(double[] data, double[] level, double[] trend, double[] seasonal) {
        // Level ban đầu = trung bình chu kỳ đầu tiên
        double initialLevel = 0;
        for (int i = 0; i < seasonLength; i++) initialLevel += data[i];
        initialLevel /= seasonLength;

        // Trend ban đầu ≈ 0 (chưa đủ dữ liệu để ước lượng tốt)
        double initialTrend = 0;
        if (data.length >= 2 * seasonLength) {
            double secondCycleAvg = 0;
            for (int i = seasonLength; i < 2 * seasonLength; i++) secondCycleAvg += data[i];
            secondCycleAvg /= seasonLength;
            initialTrend = (secondCycleAvg - initialLevel) / seasonLength;
        }

        // Seasonal index ban đầu = data[i] / initialLevel
        for (int i = 0; i < seasonLength; i++) {
            seasonal[i] = data[i] / initialLevel;
        }

        // Điền level và trend cho các vị trí đầu
        for (int i = 0; i < seasonLength; i++) {
            level[i] = initialLevel;
            trend[i] = initialTrend;
        }
    }

    private double calculateMape(double[] actual, double[] forecast, int startFrom) {
        double totalError = 0;
        int count = 0;
        for (int i = startFrom; i < actual.length; i++) {
            if (actual[i] != 0 && forecast[i] != 0) {
                totalError += Math.abs((actual[i] - forecast[i]) / actual[i]);
                count++;
            }
        }
        return count > 0 ? (totalError / count) * 100 : Double.NaN;
    }

    private double simpleAverage(List<Double> data) {
        return data.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    @Override
    public ForecastModel getModelType() {
        return ForecastModel.HOLT_WINTERS;
    }
}
