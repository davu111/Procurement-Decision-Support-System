package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.OrderScheduleResponse;
import com.ecotel.inventory_optimization_service.mapper.OrderScheduleMapper;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderScheduleService {
    private final OrderScheduleRepository scheduleRepository;
    private final OrderScheduleMapper scheduleMapper;

    public List<OrderScheduleResponse> getSchedule(LocalDate from, LocalDate to){
        List<OrderSchedule> schedules = scheduleRepository.findEffectiveByDateRange(from, to);
        return schedules.stream()
                .map(scheduleMapper::toOrderScheduleResponse)
                .toList();
    }

    public List<OrderScheduleResponse> getScheduleByProductId(String productId, LocalDate from, LocalDate to){
        List<OrderSchedule> schedules = scheduleRepository.findEffectiveByProductIdAndDateRange(productId, from, to);
        return schedules.stream()
                .map(scheduleMapper::toOrderScheduleResponse)
                .toList();
    }

    public Map<String, BigDecimal> getLatestOrderQuantity(
            List<String> productIds,
            LocalDate date
    ) {
        List<OrderSchedule> schedules =
                scheduleRepository.findLatestOrderBeforeDate(productIds, date);

        return schedules.stream()
                .collect(Collectors.toMap(
                        OrderSchedule::getProductId,
                        OrderSchedule::getOrderQuantity
                ));
    }
}
