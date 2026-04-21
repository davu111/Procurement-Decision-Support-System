package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryResultRepository;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryParameterService {

    private final InventoryParameterRepository parameterRepository;
    private final OrderScheduleRepository scheduleRepository;
    private final InventoryResultRepository resultRepository;

    /**
     * Cập nhật actualFirstOrderDate và actualEndDate từ danh sách OrderSchedules
     * (Không cần query lại DB)
     */
    @Transactional
    public void updateActualDates(InventoryParameter parameter, List<OrderSchedule> schedules, InventoryResult result) {
        if (schedules == null || schedules.isEmpty()) {
            log.warn("No order schedules provided for parameter {}", parameter.getId());
            return;
        }

        // Tìm ngày đầu và cuối từ danh sách schedules
        LocalDate firstOrderDate = schedules.stream()
                .map(OrderSchedule::getOrderDate)
                .min(LocalDate::compareTo)
                .orElse(null);

        LocalDate lastDeliveryDate = schedules.stream()
                .map(OrderSchedule::getExpectedDeliveryDate)
                .max(LocalDate::compareTo)
                .orElse(null);

        if (firstOrderDate == null || lastDeliveryDate == null) {
            log.warn("Cannot determine dates from schedules for parameter {}", parameter.getId());
            return;
        }

        // Tính ngày kết thúc thực tế
        LocalDate actualEndDate = calculateActualEndDateWithResult(lastDeliveryDate, parameter, result);

        parameter.setActualFirstOrderDate(firstOrderDate);
        parameter.setActualEndDate(actualEndDate);

        parameterRepository.save(parameter);

        log.info("Updated actual dates for parameter {}: firstOrder={}, actualEnd={}",
                parameter.getId(), firstOrderDate, actualEndDate);
    }
    /**
     * Cập nhật actualFirstOrderDate và actualEndDate cho một InventoryParameter
     * dựa trên OrderSchedules đã được tạo
     */
    @Transactional
    public void updateActualDates(Long parameterId) {
        InventoryParameter parameter = parameterRepository.findById(parameterId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryParameter not found: " + parameterId));

        updateActualDates(parameter);
    }

    /**
     * Cập nhật actualFirstOrderDate và actualEndDate cho InventoryParameter
     */
    @Transactional
    public void updateActualDates(InventoryParameter parameter) {
        if (parameter.getInventoryResult() == null) {
            log.warn("InventoryParameter {} has no result, skipping actual dates update", parameter.getId());
            return;
        }

        Long parameterId = parameter.getId();

        // Lấy ngày đặt hàng đầu tiên
        LocalDate firstOrderDate = scheduleRepository.findFirstOrderDate(parameterId)
                .orElse(null);

        // Lấy ngày giao hàng cuối cùng
        LocalDate lastDeliveryDate = scheduleRepository.findLastDeliveryDate(parameterId)
                .orElse(null);

        if (firstOrderDate == null || lastDeliveryDate == null) {
            log.warn("No order schedules found for InventoryParameter {}", parameterId);
            return;
        }

        // Tính ngày kết thúc thực tế = lastDeliveryDate + Tn + Tt
        LocalDate actualEndDate = calculateActualEndDate(lastDeliveryDate, parameter);

        parameter.setActualFirstOrderDate(firstOrderDate);
        parameter.setActualEndDate(actualEndDate);

        parameterRepository.save(parameter);

        log.info("Updated actual dates for InventoryParameter {}: firstOrder={}, actualEnd={}",
                parameterId, firstOrderDate, actualEndDate);
    }

//    /**
//     * Tính ngày kết thúc thực tế = lastDeliveryDate + Tn + Tt
//     * Tn = thời gian bổ sung = S*/K (replenishmentTimeTn)
//     * Tt = thời gian sử dụng ≈ τ* (optimalCycleTimeTau)
//        */
    private LocalDate calculateActualEndDateWithResult(LocalDate lastDeliveryDate, InventoryParameter parameter, InventoryResult result) {
//        InventoryResult result = parameter.getInventoryResult();

        // τ* (chu kỳ đặt hàng)
        BigDecimal t = result.getOptimalCycleTimeTau();

        // Convert sang số ngày (giả sử 1 tháng = 30 ngày)
        long daysToAdd = t.multiply(new BigDecimal("30"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        return lastDeliveryDate.plusDays(daysToAdd);
    }
    private LocalDate calculateActualEndDate(LocalDate lastDeliveryDate, InventoryParameter parameter) {
        InventoryResult result = parameter.getInventoryResult();

        // τ* (chu kỳ đặt hàng)
        BigDecimal t = result.getOptimalCycleTimeTau();

        // Convert sang số ngày (giả sử 1 tháng = 30 ngày)
        long daysToAdd = t.multiply(new BigDecimal("30"))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        return lastDeliveryDate.plusDays(daysToAdd);
    }

    /**
     * Cập nhật actual dates cho nhiều parameters cùng lúc
     */
    @Transactional
    public void batchUpdateActualDates(List<Long> parameterIds) {
        for (Long parameterId : parameterIds) {
            try {
                updateActualDates(parameterId);
            } catch (Exception e) {
                log.error("Failed to update actual dates for parameter {}: {}",
                        parameterId, e.getMessage());
            }
        }
    }
}
