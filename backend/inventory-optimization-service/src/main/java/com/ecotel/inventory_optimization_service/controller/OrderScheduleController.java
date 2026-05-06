package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.*;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.service.OrderScheduleChainService;
import com.ecotel.inventory_optimization_service.service.OrderScheduleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/order-schedules")
@RequiredArgsConstructor
public class OrderScheduleController {

    private final OrderScheduleService scheduleService;
    private final OrderScheduleChainService chainService;

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
            @PathVariable String productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        log.info("Lấy lịch kế hoạch đặt hàng cho sản phẩm ID: {}, từ {} đến {}", productId, from, to);
        List<OrderScheduleResponse> schedules = scheduleService.getScheduleByProductId(productId, from, to);
        System.out.println(schedules);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }
    // Lấy lịch theo inventoryResultId
    @GetMapping("/result/{inventoryResultId}")
    public ResponseEntity<ApiResponse<List<OrderScheduleResponse>>> getScheduleByResult(
            @PathVariable Long inventoryResultId) {
        log.info("Lấy lịch kế hoạch đặt hàng cho kết quả ID: {}", inventoryResultId);
        List<OrderScheduleResponse> schedules = scheduleService.getScheduleByResultId(inventoryResultId);
        System.out.println(schedules);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    /**
     * Lấy OrderSchedules hợp lệ theo chuỗi ghì đè của một product
     * GET /api/order-schedules/product/{productId}/chain
     */
    @GetMapping("/product/{productId}/chain")
    public ResponseEntity<ApiResponse<OrderScheduleChainResponse>> getOrderScheduleChain(
            @PathVariable String productId) {
        try {
            List<OrderSchedule> schedules = chainService.getActiveOrderScheduleChain(productId);

            OrderScheduleChainResponse response = OrderScheduleChainResponse.builder()
                    .productId(productId)
                    .totalSchedules(schedules.size())
                    .schedules(schedules.stream()
                            .map(this::toDto)
                            .toList())
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Error getting order schedule chain for product {}: {}",
                    productId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy OrderSchedules từ một InventoryParameter cụ thể
     * GET /api/order-schedules/parameter/{parameterId}/chain
     */
    @GetMapping("/parameter/{parameterId}/chain")
    public ResponseEntity<OrderScheduleChainResponse> getOrderScheduleChainFromParameter(
            @PathVariable Long parameterId) {
        try {
            List<OrderSchedule> schedules = chainService
                    .getOrderScheduleChainFromParameter(parameterId);

            OrderScheduleChainResponse response = OrderScheduleChainResponse.builder()
                    .parameterId(parameterId)
                    .totalSchedules(schedules.size())
                    .schedules(schedules.stream()
                            .map(this::toDto)
                            .toList())
                    .build();

            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error getting order schedule chain from parameter {}: {}",
                    parameterId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy chuỗi InventoryParameters (để debug/visualize)
     * GET /api/order-schedules/product/{productId}/parameter-chain
     */
    @GetMapping("/product/{productId}/parameter-chain")
    public ResponseEntity<ParameterChainResponse> getParameterChain(
            @PathVariable String productId) {
        try {
            List<InventoryParameter> chain = chainService.getParameterChain(productId);

            ParameterChainResponse response = ParameterChainResponse.builder()
                    .productId(productId)
                    .chainLength(chain.size())
                    .parameters(chain.stream()
                            .map(this::toParameterDto)
                            .toList())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting parameter chain for product {}: {}",
                    productId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/last-order")
    public ApiResponse<Map<String, BigDecimal>> getLastOrderQuantity(@RequestBody List<String> productIds, @RequestParam LocalDate date) {
        try {
            System.out.println(productIds);
            System.out.println(date);
            Map<String, BigDecimal> lastQuantities = scheduleService.getLatestOrderQuantity(productIds, date);
            System.out.println(lastQuantities);
            return ApiResponse.<Map<String, BigDecimal>>builder()
                    .message("Get Map Last Order Successful")
                    .data(lastQuantities)
                    .build();
        } catch (Exception e) {
            log.error("Error getting last order quantities for products {}: {}",
                    productIds, e.getMessage());
            return ApiResponse.<Map<String, BigDecimal>>builder()
                    .message("Get Map Last Order Failed")
                    .build();
        }
    }

    private OrderScheduleDto toDto(OrderSchedule schedule) {
        return OrderScheduleDto.builder()
                .id(schedule.getId())
                .parameterId(schedule.getInventoryResult().getInventoryParameter().getId())
                .inventoryResultId(schedule.getInventoryResult().getId())
                .productId(schedule.getProductId())
                .orderSequence(schedule.getOrderSequence())
                .orderDate(schedule.getOrderDate())
                .expectedDeliveryDate(schedule.getExpectedDeliveryDate())
                .orderQuantity(schedule.getOrderQuantity())
                .estimatedCost(schedule.getEstimatedCost())
                .build();
    }

    private ParameterChainDto toParameterDto(InventoryParameter param) {
        return ParameterChainDto.builder()
                .id(param.getId())
                .planStartDate(param.getPlanStartDate())
                .planEndDate(param.getPlanEndDate())
                .actualFirstOrderDate(param.getActualFirstOrderDate())
                .actualEndDate(param.getActualEndDate())
                .paramReceipt(param.getParamReceipt())
                .status(param.getStatus())
                .build();
    }
}
