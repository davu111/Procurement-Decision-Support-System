package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.OrderScheduleResponse;
import com.ecotel.inventory_optimization_service.mapper.OrderScheduleMapper;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderScheduleService {
    private final OrderScheduleRepository scheduleRepository;
    private final OrderScheduleMapper scheduleMapper;

    public List<OrderScheduleResponse> getSchedule(LocalDate from, LocalDate to){
        List<OrderSchedule> schedules = scheduleRepository.findByOrderDateBetween(from, to);
        return schedules.stream()
                .map(scheduleMapper::toOrderScheduleResponse)
                .toList();
    }

    public List<OrderScheduleResponse> getScheduleByProductId(Long productId, LocalDate from, LocalDate to){
        List<OrderSchedule> schedules = scheduleRepository.findByProductIdAndOrderDateBetween(productId, from, to);
        return schedules.stream()
                .map(scheduleMapper::toOrderScheduleResponse)
                .toList();
    }
}
