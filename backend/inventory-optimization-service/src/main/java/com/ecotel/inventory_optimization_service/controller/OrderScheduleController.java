package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.OrderScheduleResponse;
import com.ecotel.inventory_optimization_service.service.OrderScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/order-schedules")
@RequiredArgsConstructor
public class OrderScheduleController {

    private final OrderScheduleService scheduleService;

    /**
     * GET /api/inventory/schedule?from=2025-01-01&to=2025-12-31
     * Lấy lịch kế hoạch đặt hàng toàn bộ theo khoảng thời gian
     */
    @GetMapping()
    public ResponseEntity<ApiResponse<List<OrderScheduleResponse>>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<OrderScheduleResponse> schedules = scheduleService.getSchedule(from, to);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    /**
     * GET /api/inventory/schedule/{productId}?from=...&to=...
     * Lịch kế hoạch theo mặt hàng cụ thể
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<OrderScheduleResponse>>> getScheduleByProduct(
            @PathVariable Long productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.info("Lấy lịch kế hoạch đặt hàng cho sản phẩm ID: {}, từ {} đến {}", productId, from, to);
        List<OrderScheduleResponse> schedules = scheduleService.getScheduleByProductId(productId, from, to);
        System.out.println(schedules);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }
}
