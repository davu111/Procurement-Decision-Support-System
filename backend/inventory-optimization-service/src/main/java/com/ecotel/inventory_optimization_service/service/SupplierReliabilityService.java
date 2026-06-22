package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.supplier.SupplierProductData;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.dto.response.SupplierReliabilityResponse;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.inventory_optimization_service.service.forecast.ForecastOrchestrator;
import com.ecotel.inventory_optimization_service.service.supplier.SupplierServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Tính toán độ tin cậy nhà cung cấp dựa trên so sánh lead time cam kết vs thực tế.
 *
 * <p>Công thức:
 * <pre>
 *   avgActualLeadTime = trung bình actualLeadTimeDays trong N kỳ gần nhất (N <= 6, min = 3)
 *   stdDevLeadTime    = độ lệch chuẩn actualLeadTimeDays trong N kỳ
 *   deviationRate     = (avgActualLeadTime - committedLeadTimeDays) / committedLeadTimeDays
 *   reliabilityLevel:
 *     RELIABLE   — |deviationRate| <= 10% VÀ stdDev < 2 ngày
 *     MODERATE   — |deviationRate| <= 25%
 *     UNRELIABLE — |deviationRate| > 25% HOẶC stdDev >= 2 ngày
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierReliabilityService {

    private static final int MAX_PERIODS = 6;
    private static final int MIN_PERIODS = 3;

    // Ngưỡng phân loại
    private static final double RELIABLE_DEVIATION  = 0.10;
    private static final double MODERATE_DEVIATION  = 0.25;
    private static final double RELIABLE_STD_DEV    = 2.0;  // ngày

    private final ConsumptionHistoryRepository consumptionHistoryRepository;
    private final SupplierServiceClient        supplierServiceClient;
    private final ForecastOrchestrator         forecastOrchestrator;

    public SupplierReliabilityResponse calculateReliability(String productId) {

        // 1. Lấy committedLeadTimeDays từ Supplier Service
        Optional<SupplierProductData> supplierOpt = supplierServiceClient.getByProductId(productId);
        if (supplierOpt.isEmpty()) {
            log.warn("Không tìm thấy nhà cung cấp cho productId={}", productId);
            return SupplierReliabilityResponse.builder()
                    .productId(productId)
                    .reliabilityLevel("UNKNOWN")
                    .recommendation("Không có thông tin nhà cung cấp để đánh giá độ tin cậy.")
                    .dataPointsUsed(0)
                    .build();
        }

        Integer committed = supplierOpt.get().getCommittedLeadTimeDays();
        if (committed == null || committed <= 0) {
            return SupplierReliabilityResponse.builder()
                    .productId(productId)
                    .reliabilityLevel("UNKNOWN")
                    .recommendation("Nhà cung cấp chưa có thông tin lead time cam kết.")
                    .dataPointsUsed(0)
                    .build();
        }

        // 2. Lấy N kỳ gần nhất có actualLeadTimeDays
        List<ConsumptionHistory> recent = consumptionHistoryRepository
                .findRecentWithLeadTime(productId, PageRequest.of(0, MAX_PERIODS));

        if (recent.isEmpty()) {
            return SupplierReliabilityResponse.builder()
                    .productId(productId)
                    .committedLeadTimeDays(committed)
                    .reliabilityLevel("UNKNOWN")
                    .recommendation("Chưa có dữ liệu lead time thực tế. Hãy cập nhật lịch sử tiêu thụ để đánh giá nhà cung cấp.")
                    .dataPointsUsed(0)
                    .build();
        }

        // 3. Tính thống kê
        List<Double> values = recent.stream()
                .map(h -> h.getActualLeadTimeDays().doubleValue())
                .toList();

        int n = values.size();
        double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double variance = values.stream()
                .mapToDouble(v -> (v - avg) * (v - avg))
                .sum() / Math.max(n - 1, 1);   // sample std dev (n-1)
        double stdDev = Math.sqrt(variance);

        double deviationRate = (avg - committed) / committed;

        // 4. Phân loại
        String level;
        String recommendation;
        double absDeviation = Math.abs(deviationRate);

        if (absDeviation <= RELIABLE_DEVIATION && stdDev < RELIABLE_STD_DEV) {
            level = "RELIABLE";
            recommendation = "Nhà cung cấp đáng tin cậy. Lead time ổn định, sai lệch thấp. Có thể dùng lead time cam kết để lập kế hoạch.";
        } else if (absDeviation <= MODERATE_DEVIATION) {
            level = "MODERATE";
            if (deviationRate > 0) {
                recommendation = String.format(
                        "Nhà cung cấp giao hàng trễ hơn cam kết %.1f%%. Cân nhắc điều chỉnh điểm đặt hàng B hoặc dùng lead time dự báo.",
                        absDeviation * 100);
            } else {
                recommendation = String.format(
                        "Nhà cung cấp giao hàng sớm hơn cam kết %.1f%%. Không có rủi ro tồn kho.",
                        absDeviation * 100);
            }
        } else {
            level = "UNRELIABLE";
            if (stdDev >= RELIABLE_STD_DEV && absDeviation > MODERATE_DEVIATION) {
                recommendation = String.format(
                        "Nhà cung cấp KHÔNG đáng tin cậy: sai lệch %.1f%% và độ dao động lead time cao (±%.1f ngày). Cần tăng safety stock hoặc đàm phán lại hợp đồng.",
                        absDeviation * 100, stdDev);
            } else if (stdDev >= RELIABLE_STD_DEV) {
                recommendation = String.format(
                        "Lead time biến động lớn (±%.1f ngày). Nên dùng dự báo thay cho cam kết để tránh thiếu hàng.",
                        stdDev);
            } else {
                recommendation = String.format(
                        "Nhà cung cấp giao hàng trễ hơn cam kết %.1f%%. Cần xem xét lại nhà cung cấp hoặc tăng safety stock.",
                        absDeviation * 100);
            }
        }

        // Thêm ghi chú nếu dữ liệu ít hơn MIN_PERIODS
        if (n < MIN_PERIODS) {
            recommendation = "[Dữ liệu giới hạn: " + n + " kỳ] " + recommendation;
        }

        // 5. Forecast lead time từ WMA để tham khảo
        Double forecastDays = null;
        try {
            ForecastResult ltForecast = forecastOrchestrator.forecastLeadTime(productId);
            if (!ltForecast.isRequiresManualInput() && ltForecast.getForecastValue() > 0) {
                forecastDays = ltForecast.getForecastValue();
            }
        } catch (Exception e) {
            log.warn("Không thể forecast lead time cho productId={}: {}", productId, e.getMessage());
        }

        log.info("Supplier reliability for productId={}: level={}, avg={:.2f}, stdDev={:.2f}, deviation={:.2f}%",
                productId, level, avg, stdDev, deviationRate * 100);

        return SupplierReliabilityResponse.builder()
                .productId(productId)
                .committedLeadTimeDays(committed)
                .avgActualLeadTimeDays(Math.round(avg * 100.0) / 100.0)
                .stdDevLeadTimeDays(Math.round(stdDev * 100.0) / 100.0)
                .deviationRate(Math.round(deviationRate * 10000.0) / 10000.0)
                .reliabilityLevel(level)
                .dataPointsUsed(n)
                .recommendation(recommendation)
                .forecastLeadTimeDays(forecastDays != null
                        ? Math.round(forecastDays * 100.0) / 100.0
                        : null)
                .build();
    }
}
