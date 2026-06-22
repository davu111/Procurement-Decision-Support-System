package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.response.LossRateAnalysisResponse;
import com.ecotel.inventory_optimization_service.model.StockCount;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import com.ecotel.inventory_optimization_service.repository.StockCountRepository;
import com.ecotel.inventory_optimization_service.repository.WarehouseConfigRepository;
import com.ecotel.inventory_optimization_service.service.LossRateAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Triển khai phân tích tỷ lệ thất thoát (mất/hao hụt) từ dữ liệu kiểm kê.
 *
 * Logic:
 *   1. Lấy tất cả phiếu CONFIRMED của sản phẩm trong khoảng [from, to]
 *   2. Tính tỷ lệ mất hàng trung bình: Σ |varianceQty| (âm) / Σ systemQuantity
 *   3. Tính tổng giá trị thất thoát: Σ varianceValue (âm)
 *   4. So sánh với spoilageRate cấu hình trong WarehouseConfig
 *   5. Đưa ra cảnh báo nếu vượt 5% hoặc lệch >30% so với cấu hình
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LossRateAnalyticsServiceImpl implements LossRateAnalyticsService {

    private static final BigDecimal LOSS_WARNING_THRESHOLD = new BigDecimal("0.05");
    private static final BigDecimal DEVIATION_THRESHOLD = new BigDecimal("0.3");

    private final StockCountRepository stockCountRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;

    @Override
    public LossRateAnalysisResponse analyzeLossRate(String productId, LocalDate from, LocalDate to) {
        log.info("Analyzing loss rate for productId={} from={} to={}", productId, from, to);

        // Lấy danh sách phiếu CONFIRMED trong khoảng thời gian
        List<StockCount> confirmedCounts = stockCountRepository.findConfirmedInRange(productId, from, to);

        if (confirmedCounts.isEmpty()) {
            log.warn("No confirmed stock counts found for productId={} in range [{}, {}]", productId, from, to);
            return LossRateAnalysisResponse.builder()
                    .productId(productId)
                    .fromDate(from)
                    .toDate(to)
                    .stockCountsUsed(0)
                    .avgLossRate(BigDecimal.ZERO)
                    .totalLossValue(BigDecimal.ZERO)
                    .message("Không có phiếu kiểm kê CONFIRMED trong khoảng thời gian này.")
                    .details(List.of())
                    .build();
        }

        // Tính toán metrics
        BigDecimal totalSystemQty = BigDecimal.ZERO;
        BigDecimal totalLossQty = BigDecimal.ZERO;
        BigDecimal totalLossValue = BigDecimal.ZERO;
        BigDecimal latestVarianceRate = BigDecimal.ZERO;
        boolean latestLossWarning = false;

        for (int i = 0; i < confirmedCounts.size(); i++) {
            StockCount sc = confirmedCounts.get(i);
            totalSystemQty = totalSystemQty.add(sc.getSystemQuantity());

            // Chỉ tính khi actual < system (mất hàng)
            if (sc.getVarianceQty() != null && sc.getVarianceQty().signum() < 0) {
                totalLossQty = totalLossQty.add(sc.getVarianceQty().abs());
                if (sc.getVarianceValue() != null) {
                    totalLossValue = totalLossValue.add(sc.getVarianceValue());
                }
            }

            // Lưu lại variance rate của phiếu gần nhất
            if (i == confirmedCounts.size() - 1 && sc.getVarianceRate() != null) {
                latestVarianceRate = sc.getVarianceRate();
                latestLossWarning = sc.getVarianceQty() != null && sc.getVarianceQty().signum() < 0
                        && sc.getVarianceRate().abs().compareTo(LOSS_WARNING_THRESHOLD) > 0;
            }
        }

        // Tính tỷ lệ thất thoát trung bình
        BigDecimal avgLossRate = totalSystemQty.compareTo(BigDecimal.ZERO) > 0
                ? totalLossQty.divide(totalSystemQty, 6, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Lấy cấu hình spoilageRate
        WarehouseConfig config = warehouseConfigRepository.findFirstByOrderByIdDesc()
                .orElse(null);
        BigDecimal configuredSpoilageRate = config != null
                ? config.getSpoilageRate()
                : BigDecimal.ZERO;

        // Kiểm tra độ lệch so với cấu hình
        boolean suggestUpdateSpoilageRate = false;
        if (configuredSpoilageRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal deviation = avgLossRate.subtract(configuredSpoilageRate).abs()
                    .divide(configuredSpoilageRate, 6, RoundingMode.HALF_UP);
            suggestUpdateSpoilageRate = deviation.compareTo(DEVIATION_THRESHOLD) > 0;
        }

        // Xây dựng chi tiết
        List<LossRateAnalysisResponse.StockCountSummary> details = confirmedCounts.stream()
                .map(sc -> LossRateAnalysisResponse.StockCountSummary.builder()
                        .stockCountId(sc.getId())
                        .countDate(sc.getCountDate())
                        .systemQuantity(sc.getSystemQuantity())
                        .actualQuantity(sc.getActualQuantity())
                        .varianceQty(sc.getVarianceQty())
                        .varianceRate(sc.getVarianceRate())
                        .varianceValue(sc.getVarianceValue())
                        .lossWarning(
                                sc.getVarianceQty() != null && sc.getVarianceQty().signum() < 0
                                && sc.getVarianceRate() != null
                                && sc.getVarianceRate().abs().compareTo(LOSS_WARNING_THRESHOLD) > 0
                        )
                        .build())
                .toList();

        // Xây dựng thông báo
        StringBuilder message = new StringBuilder();
        message.append(String.format("Phân tích thất thoát từ %d phiếu kiểm kê. ", confirmedCounts.size()));
        message.append(String.format("Tỷ lệ trung bình: %.2f%%. ", avgLossRate.multiply(BigDecimal.valueOf(100)).doubleValue()));
        message.append(String.format("Tổng giá trị: %.0f VND. ", totalLossValue.doubleValue()));

        if (latestLossWarning) {
            message.append(String.format("⚠️ CẢNH BÁO: Phiếu gần nhất vượt 5%% (%.2f%%). ", 
                    latestVarianceRate.multiply(BigDecimal.valueOf(100)).doubleValue()));
        }

        if (suggestUpdateSpoilageRate) {
            message.append(String.format("💡 ĐỀ XUẤT: Cập nhật spoilageRate từ %.2f%% thành %.2f%%.",
                    configuredSpoilageRate.multiply(BigDecimal.valueOf(100)).doubleValue(),
                    avgLossRate.multiply(BigDecimal.valueOf(100)).doubleValue()));
        }

        log.info("Loss rate analysis: avgRate={}, totalValue={}, warning={}, suggest={}",
                avgLossRate, totalLossValue, latestLossWarning, suggestUpdateSpoilageRate);

        return LossRateAnalysisResponse.builder()
                .productId(productId)
                .fromDate(from)
                .toDate(to)
                .stockCountsUsed(confirmedCounts.size())
                .avgLossRate(avgLossRate)
                .totalLossValue(totalLossValue.setScale(2, RoundingMode.HALF_UP))
                .configuredSpoilageRate(configuredSpoilageRate)
                .exceedsWarningThreshold(latestLossWarning)
                .suggestUpdateSpoilageRate(suggestUpdateSpoilageRate)
                .message(message.toString())
                .details(details)
                .build();
    }
}
