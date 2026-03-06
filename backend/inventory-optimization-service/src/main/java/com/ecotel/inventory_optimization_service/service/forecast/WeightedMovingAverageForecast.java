package com.ecotel.inventory_optimization_service.service.forecast;

import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.enums.ForecastModel;
import org.springframework.stereotype.Component;

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

    // Trọng số: tổng = 1.0, kỳ gần nhất được tin cậy hơn
    private static final double[] WEIGHTS_3 = {0.50, 0.30, 0.20}; // 3 điểm
    private static final double[] WEIGHTS_2 = {0.65, 0.35};        // 2 điểm
    private static final double[] WEIGHTS_1 = {1.00};               // 1 điểm

    @Override
    public ForecastResult forecast(List<Double> historicalData) {
        int n = historicalData.size();
        if (n == 0) throw new IllegalArgumentException("Không có dữ liệu lịch sử");

        double[] weights = selectWeights(n);
        double[] recentData = getRecentData(historicalData, weights.length);

        double forecastValue = 0;
        for (int i = 0; i < weights.length; i++) {
            forecastValue += weights[i] * recentData[i];
        }

        double mape = calculateMape(historicalData, weights);

        return ForecastResult.builder()
                .forecastValue(forecastValue)
                .modelUsed(ForecastModel.WMA)
                .mape(mape)
                .dataPointsUsed(n)
                .description(buildDescription(weights, recentData, forecastValue))
                .build();
    }

    private double[] selectWeights(int dataCount) {
        if (dataCount >= 3) return WEIGHTS_3;
        if (dataCount == 2) return WEIGHTS_2;
        return WEIGHTS_1;
    }

    private double[] getRecentData(List<Double> data, int count) {
        int size = data.size();
        double[] recent = new double[count];
        // Lấy từ mới nhất → cũ nhất
        for (int i = 0; i < count; i++) {
            recent[i] = data.get(size - 1 - i);
        }
        return recent;
    }

    /**
     * Tính MAPE bằng cross-validation đơn giản (leave-last-one-out)
     */
    private double calculateMape(List<Double> data, double[] weights) {
        if (data.size() < weights.length + 1) return Double.NaN;

        double totalError = 0;
        int count = 0;

        for (int t = weights.length; t < data.size(); t++) {
            double predicted = 0;
            for (int i = 0; i < weights.length; i++) {
                predicted += weights[i] * data.get(t - 1 - i);
            }
            double actual = data.get(t);
            if (actual != 0) {
                totalError += Math.abs((actual - predicted) / actual);
                count++;
            }
        }

        return count > 0 ? (totalError / count) * 100 : Double.NaN;
    }

    private String buildDescription(double[] weights, double[] recentData, double forecast) {
        StringBuilder sb = new StringBuilder("WMA: ");
        for (int i = 0; i < weights.length; i++) {
            sb.append(String.format("%.0f%%×%.2f", weights[i] * 100, recentData[i]));
            if (i < weights.length - 1) sb.append(" + ");
        }
        sb.append(String.format(" = %.4f", forecast));
        return sb.toString();
    }

    @Override
    public ForecastModel getModelType() {
        return ForecastModel.WMA;
    }
}
