package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.response.ServiceLevelAnalysisResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import com.ecotel.inventory_optimization_service.service.ServiceLevelAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Triển khai phân tích Service Level từ dữ liệu giao hàng thực tế.
 *
 * Service Level = 1 - (số chu kỳ có stockout / tổng chu kỳ)
 *
 * Công thức:
 *   - Stockout cycle: chu kỳ mà tồn kho mô phỏng chạm 0 trong [orderDate, nextOrderDate)
 *   - Avg stockout duration = tổng ngày stockout / số chu kỳ stockout
 *   - Avg delivery delay = tổng ngày trễ / tổng chu kỳ
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceLevelAnalyticsServiceImpl implements ServiceLevelAnalyticsService {

    private final OrderScheduleRepository orderScheduleRepository;
    private final InventoryPlanningService inventoryPlanningService;

    @Override
    public ServiceLevelAnalysisResponse analyzeServiceLevel(String productId, LocalDate from, LocalDate to) {
        log.info("Analyzing service level for productId={} from={} to={}", productId, from, to);

        // Lấy danh sách lịch đặt hàng hiệu lực trong khoảng thời gian
        List<OrderSchedule> schedules = orderScheduleRepository.findEffectiveByProductIdAndDateRange(productId, from, to);

        if (schedules.isEmpty()) {
            log.warn("No effective order schedules found for productId={} in range [{}, {}]", productId, from, to);
            return ServiceLevelAnalysisResponse.builder()
                    .productId(productId)
                    .fromDate(from)
                    .toDate(to)
                    .totalCycles(0)
                    .stockoutFrequency(0.0)
                    .serviceLevel(1.0)
                    .avgStockoutDuration(0.0)
                    .avgDeliveryDelay(0.0)
                    .totalStockoutDays(0)
                    .totalDelayDays(0)
                    .cyclesWithActualDelivery(0)
                    .build();
        }

        int totalCycles = 0;
        int stockoutCycles = 0;
        long totalStockoutDays = 0;
        long totalDelayDays = 0;
        int cyclesWithActualDelivery = 0;

        for (OrderSchedule schedule : schedules) {
            totalCycles++;

            // Tính độ trễ giao hàng
            if (schedule.getActualDeliveryDate() != null) {
                cyclesWithActualDelivery++;
                long delayDays = ChronoUnit.DAYS.between(
                        schedule.getExpectedDeliveryDate(),
                        schedule.getActualDeliveryDate()
                );
                if (delayDays > 0) {
                    totalDelayDays += delayDays;
                }
            }

            // Mô phỏng tồn kho để phát hiện stockout
            // Tìm chu kỳ tiếp theo để xác định ngày kết thúc mô phỏng
            OrderSchedule nextSchedule = findNextSchedule(schedules, schedule);
            LocalDate cycleEndDate = nextSchedule != null
                    ? nextSchedule.getOrderDate().minusDays(1)
                    : schedule.getOrderDate().plusDays(30); // Fallback: 30 ngày

            // Mô phỏng từng ngày trong chu kỳ
            long stockoutDaysInCycle = countStockoutDays(productId, schedule.getOrderDate(), cycleEndDate);
            if (stockoutDaysInCycle > 0) {
                stockoutCycles++;
                totalStockoutDays += stockoutDaysInCycle;
            }
        }

        // Tính metrics
        double serviceLevel = totalCycles == 0 ? 1.0 : 1.0 - ((double) stockoutCycles / totalCycles);
        double avgStockoutDuration = stockoutCycles == 0 ? 0.0 : (double) totalStockoutDays / stockoutCycles;
        double avgDeliveryDelay = totalCycles == 0 ? 0.0 : (double) totalDelayDays / totalCycles;

        log.info("Service level analysis: SL={}, stockoutFreq={}, avgDelay={} days",
                String.format("%.2f", serviceLevel * 100),
                String.format("%.2f", (1 - serviceLevel) * 100),
                String.format("%.2f", avgDeliveryDelay));

        return ServiceLevelAnalysisResponse.builder()
                .productId(productId)
                .fromDate(from)
                .toDate(to)
                .totalCycles(totalCycles)
                .stockoutFrequency(1.0 - serviceLevel)
                .serviceLevel(serviceLevel)
                .avgStockoutDuration(avgStockoutDuration)
                .avgDeliveryDelay(avgDeliveryDelay)
                .totalStockoutDays(totalStockoutDays)
                .totalDelayDays(totalDelayDays)
                .cyclesWithActualDelivery(cyclesWithActualDelivery)
                .build();
    }

    @Override
    @Transactional
    public void confirmDelivery(Long orderId, LocalDate actualDeliveryDate) {
        OrderSchedule schedule = orderScheduleRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch đặt hàng", orderId));

        schedule.setActualDeliveryDate(actualDeliveryDate);
        orderScheduleRepository.save(schedule);

        log.info("Confirmed delivery for orderId={} on {}", orderId, actualDeliveryDate);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /**
     * Tìm OrderSchedule tiếp theo trong danh sách (có orderDate ngay sau schedule hiện tại).
     */
    private OrderSchedule findNextSchedule(List<OrderSchedule> schedules, OrderSchedule current) {
        for (OrderSchedule s : schedules) {
            if (s.getOrderDate().isAfter(current.getOrderDate())) {
                return s;
            }
        }
        return null;
    }

    /**
     * Đếm số ngày stockout (tồn kho = 0) trong chu kỳ [startDate, endDate].
     *
     * Mô phỏng từng ngày trong chu kỳ bằng cách gọi simulateInventoryAt() cho từng ngày.
     * Nếu inventory <= 0 thì cộng vào stockout days.
     *
     * @return Số ngày stockout trong chu kỳ
     */
    private long countStockoutDays(String productId, LocalDate startDate, LocalDate endDate) {
        long stockoutDays = 0;

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            try {
                var inventory = inventoryPlanningService.simulateInventoryAt(productId, date);
                if (inventory == null || inventory.signum() <= 0) {
                    stockoutDays++;
                }
            } catch (Exception e) {
                log.debug("Error simulating inventory for productId={} on {}: {}", productId, date, e.getMessage());
            }
        }

        return stockoutDays;
    }
}
