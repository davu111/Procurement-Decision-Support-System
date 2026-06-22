package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.LossRateAnalysisResponse;
import com.ecotel.inventory_optimization_service.dto.response.ServiceLevelAnalysisResponse;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.model.StockCount;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import com.ecotel.inventory_optimization_service.repository.StockCountRepository;
import com.ecotel.inventory_optimization_service.repository.WarehouseConfigRepository;
import com.ecotel.inventory_optimization_service.service.impl.InventoryPlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Phân tích hiệu quả tồn kho:
 *   - Service Level / Tỷ lệ chờ nhập hàng (Module C)
 *   - Loss Rate / Tỷ lệ thất thoát (Module B)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryAnalyticsService {

    /** Ngưỡng cảnh báo thất thoát đã chốt: > 5% */
    private static final BigDecimal LOSS_WARNING_THRESHOLD   = new BigDecimal("0.05");
    /** Ngưỡng đề xuất cập nhật spoilageRate: lệch > 30% */
    private static final BigDecimal SPOILAGE_UPDATE_THRESHOLD = new BigDecimal("0.30");

    private final OrderScheduleRepository  scheduleRepository;
    private final StockCountRepository     stockCountRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;
    private final InventoryPlanningService  planningService;

    // ══════════════════════════════════════════════════════════════════════
    // MODULE C — SERVICE LEVEL
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Tính Service Level / tỷ lệ chờ nhập hàng on-the-fly.
     * Mô phỏng tồn kho theo từng chu kỳ đặt hàng, xác định chu kỳ nào stockout.
     */
    public ServiceLevelAnalysisResponse analyzeServiceLevel(
            String productId, LocalDate from, LocalDate to) {

        List<OrderSchedule> schedules =
                scheduleRepository.findEffectiveByProductIdAndDateRange(productId, from, to);

        if (schedules.isEmpty()) {
            return ServiceLevelAnalysisResponse.builder()
                    .productId(productId)
                    .fromDate(from)
                    .toDate(to)
                    .totalCycles(0)
                    .serviceLevel(1.0)
                    .stockoutFrequency(0)
                    .build();
        }

        int  totalCycles      = 0;
        int  stockoutCycles   = 0;
        long totalDelayDays   = 0;
        long totalStockoutDays= 0;
        int  withActualDel    = 0;

        for (int i = 0; i < schedules.size(); i++) {
            OrderSchedule current = schedules.get(i);
            OrderSchedule next    = (i + 1 < schedules.size()) ? schedules.get(i + 1) : null;
            totalCycles++;

            // Độ trễ giao hàng
            if (current.getActualDeliveryDate() != null) {
                withActualDel++;
                long delay = ChronoUnit.DAYS.between(
                        current.getExpectedDeliveryDate(), current.getActualDeliveryDate());
                if (delay > 0) totalDelayDays += delay;
            }

            // Đếm ngày stockout trong chu kỳ này
            long stockoutDays = countStockoutDaysInCycle(productId, current, next);
            if (stockoutDays > 0) {
                stockoutCycles++;
                totalStockoutDays += stockoutDays;
            }
        }

        double serviceLevel = totalCycles == 0 ? 1.0
                : 1.0 - ((double) stockoutCycles / totalCycles);

        log.info("ServiceLevel productId={}: {}/{} cycles stockout, level={:.2f}%",
                productId, stockoutCycles, totalCycles, serviceLevel * 100);

        return ServiceLevelAnalysisResponse.builder()
                .productId(productId)
                .fromDate(from)
                .toDate(to)
                .totalCycles(totalCycles)
                .stockoutFrequency(totalCycles == 0 ? 0 : (double) stockoutCycles / totalCycles)
                .serviceLevel(serviceLevel)
                .avgStockoutDuration(stockoutCycles == 0 ? 0 : (double) totalStockoutDays / stockoutCycles)
                .avgDeliveryDelay(totalCycles == 0 ? 0 : (double) totalDelayDays / totalCycles)
                .totalStockoutDays(totalStockoutDays)
                .totalDelayDays(totalDelayDays)
                .cyclesWithActualDelivery(withActualDel)
                .build();
    }

    /**
     * Đếm số ngày stockout (tồn kho <= 0) trong chu kỳ từ current.orderDate đến next.orderDate.
     * Tái sử dụng simulateInventoryAt() — không viết lại logic mô phỏng.
     */
    private long countStockoutDaysInCycle(String productId,
                                          OrderSchedule current, OrderSchedule next) {
        LocalDate cycleStart = current.getOrderDate();
        LocalDate cycleEnd   = next != null
                ? next.getOrderDate().minusDays(1)
                : current.getExpectedDeliveryDate().plusDays(30);

        long stockoutDays = 0;
        for (LocalDate d = cycleStart; !d.isAfter(cycleEnd); d = d.plusDays(1)) {
            BigDecimal inv = planningService.simulateStockCountInventoryAt(productId, d);
            if (inv != null && inv.compareTo(BigDecimal.ZERO) <= 0) {
                stockoutDays++;
            }
        }
        return stockoutDays;
    }

    // ══════════════════════════════════════════════════════════════════════
    // MODULE B — LOSS RATE
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Phân tích tỷ lệ thất thoát dựa trên phiếu kiểm kê CONFIRMED trong kỳ.
     * Yêu cầu ít nhất 1 phiếu CONFIRMED để có kết quả.
     */
    public LossRateAnalysisResponse analyzeLossRate(String productId, LocalDate from, LocalDate to) {
        List<StockCount> confirmed = stockCountRepository.findConfirmedInRange(productId, from, to);

        if (confirmed.isEmpty()) {
            return LossRateAnalysisResponse.builder()
                    .productId(productId)
                    .fromDate(from)
                    .toDate(to)
                    .stockCountsUsed(0)
                    .avgLossRate(BigDecimal.ZERO)
                    .totalLossValue(BigDecimal.ZERO)
                    .exceedsWarningThreshold(false)
                    .suggestUpdateSpoilageRate(false)
                    .message("Chưa có dữ liệu kiểm kê CONFIRMED trong kỳ phân tích. " +
                             "Hãy thực hiện kiểm kê để có báo cáo thất thoát.")
                    .details(List.of())
                    .build();
        }

        // Tính tổng hợp
        BigDecimal totalSystemQty = BigDecimal.ZERO;
        BigDecimal totalLossQty   = BigDecimal.ZERO;
        BigDecimal totalLossValue = BigDecimal.ZERO;

        for (StockCount sc : confirmed) {
            if (sc.getSystemQuantity() != null) {
                totalSystemQty = totalSystemQty.add(sc.getSystemQuantity());
            }
            if (sc.getVarianceQty() != null && sc.getVarianceQty().signum() < 0) {
                // Chỉ tính phần âm (thất thoát thực sự)
                totalLossQty  = totalLossQty.add(sc.getVarianceQty().abs());
                if (sc.getVarianceValue() != null) {
                    totalLossValue = totalLossValue.add(sc.getVarianceValue().abs());
                }
            }
        }

        BigDecimal avgLossRate = totalSystemQty.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalLossQty.divide(totalSystemQty, 4, RoundingMode.HALF_UP);

        // Kiểm tra cảnh báo từ lần kiểm kê gần nhất
        StockCount latest = confirmed.get(confirmed.size() - 1);
        boolean exceedsWarning = latest.getVarianceQty() != null
                && latest.getVarianceQty().signum() < 0
                && latest.getVarianceRate() != null
                && latest.getVarianceRate().abs().compareTo(LOSS_WARNING_THRESHOLD) > 0;

        // So sánh với spoilageRate cấu hình
        BigDecimal configuredSpoilageRate = warehouseConfigRepository.findDefaultConfig()
                .map(wc -> wc.getSpoilageRate())
                .orElse(null);

        boolean suggestUpdate = false;
        if (configuredSpoilageRate != null && configuredSpoilageRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = avgLossRate.subtract(configuredSpoilageRate).abs();
            BigDecimal relDiff = diff.divide(configuredSpoilageRate, 4, RoundingMode.HALF_UP);
            suggestUpdate = relDiff.compareTo(SPOILAGE_UPDATE_THRESHOLD) > 0;
        }

        // Tạo message
        String message;
        if (exceedsWarning) {
            message = String.format(
                    "⚠️ Thất thoát vượt ngưỡng! Lần kiểm kê gần nhất (%s): %.1f%% tổng tồn kho. " +
                    "Tỷ lệ TB kỳ này: %.1f%%.",
                    latest.getCountDate(),
                    latest.getVarianceRate() != null ? latest.getVarianceRate().abs().doubleValue() * 100 : 0,
                    avgLossRate.doubleValue() * 100);
        } else if (suggestUpdate) {
            message = String.format(
                    "Tỷ lệ thất thoát thực tế (%.1f%%) lệch đáng kể so với cấu hình spoilageRate " +
                    "(%.1f%%). Cân nhắc cập nhật trong WarehouseConfig.",
                    avgLossRate.doubleValue() * 100,
                    configuredSpoilageRate != null ? configuredSpoilageRate.doubleValue() * 100 : 0);
        } else {
            message = String.format("Tỷ lệ thất thoát bình thường: %.1f%% trong kỳ phân tích.",
                    avgLossRate.doubleValue() * 100);
        }

        // Build details
        List<LossRateAnalysisResponse.StockCountSummary> details = confirmed.stream()
                .map(sc -> LossRateAnalysisResponse.StockCountSummary.builder()
                        .stockCountId(sc.getId())
                        .countDate(sc.getCountDate())
                        .systemQuantity(sc.getSystemQuantity())
                        .actualQuantity(sc.getActualQuantity())
                        .varianceQty(sc.getVarianceQty())
                        .varianceRate(sc.getVarianceRate())
                        .varianceValue(sc.getVarianceValue())
                        .lossWarning(sc.getVarianceQty() != null && sc.getVarianceQty().signum() < 0
                                && sc.getVarianceRate() != null
                                && sc.getVarianceRate().abs().compareTo(LOSS_WARNING_THRESHOLD) > 0)
                        .build())
                .toList();

        return LossRateAnalysisResponse.builder()
                .productId(productId)
                .fromDate(from)
                .toDate(to)
                .stockCountsUsed(confirmed.size())
                .avgLossRate(avgLossRate)
                .totalLossValue(totalLossValue)
                .configuredSpoilageRate(configuredSpoilageRate)
                .exceedsWarningThreshold(exceedsWarning)
                .suggestUpdateSpoilageRate(suggestUpdate)
                .message(message)
                .details(details)
                .build();
    }
}
