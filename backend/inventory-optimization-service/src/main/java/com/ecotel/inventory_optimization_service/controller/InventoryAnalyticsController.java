package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.LossRateAnalysisResponse;
import com.ecotel.inventory_optimization_service.dto.response.ServiceLevelAnalysisResponse;
import com.ecotel.inventory_optimization_service.service.LossRateAnalyticsService;
import com.ecotel.inventory_optimization_service.service.ServiceLevelAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Analytics endpoints để phân tích hiệu quả tồn kho:
 *   - Module B: Loss Rate Analytics (phân tích tỷ lệ thất thoát)
 *   - Module C: Service Level Analytics (phân tích mức dịch vụ)
 *
 * Endpoints:
 *   GET /api/analytics/loss-rate/{productId}?from=&to=
 *   GET /api/analytics/service-level/{productId}?from=&to=
 *   PATCH /api/order-schedules/{id}/confirm-delivery
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryAnalyticsController {

    private final LossRateAnalyticsService lossRateAnalyticsService;
    private final ServiceLevelAnalyticsService serviceLevelAnalyticsService;

    /**
     * GET /api/analytics/loss-rate/{productId}
     * Phân tích tỷ lệ thất thoát/hao hụt từ phiếu kiểm kê CONFIRMED.
     *
     * Query params:
     *   from (required): Ngày bắt đầu (YYYY-MM-DD)
     *   to   (required): Ngày kết thúc (YYYY-MM-DD)
     *
     * @return LossRateAnalysisResponse với metrics và đề xuất
     */
    @GetMapping("/analytics/loss-rate/{productId}")
    public ResponseEntity<ApiResponse<LossRateAnalysisResponse>> analyzeLossRate(
            @PathVariable String productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        LossRateAnalysisResponse result = lossRateAnalyticsService.analyzeLossRate(productId, from, to);
        return ResponseEntity.ok(ApiResponse.success(result, "Phân tích tỷ lệ thất thoát"));
    }

    /**
     * GET /api/analytics/service-level/{productId}
     * Phân tích Service Level từ lịch đặt hàng và mô phỏng tồn kho.
     *
     * Query params:
     *   from (required): Ngày bắt đầu (YYYY-MM-DD)
     *   to   (required): Ngày kết thúc (YYYY-MM-DD)
     *
     * @return ServiceLevelAnalysisResponse với metrics Service Level
     */
    @GetMapping("/analytics/service-level/{productId}")
    public ResponseEntity<ApiResponse<ServiceLevelAnalysisResponse>> analyzeServiceLevel(
            @PathVariable String productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        ServiceLevelAnalysisResponse result = serviceLevelAnalyticsService.analyzeServiceLevel(productId, from, to);
        return ResponseEntity.ok(ApiResponse.success(result, "Phân tích Service Level"));
    }

    /**
     * PATCH /api/order-schedules/{id}/confirm-delivery
     * Xác nhận ngày giao hàng thực tế cho một lịch đặt hàng.
     *
     * Body: { actualDeliveryDate: "YYYY-MM-DD" }
     */
    @PatchMapping("/order-schedules/{id}/confirm-delivery")
    public ResponseEntity<ApiResponse<String>> confirmDelivery(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        String actualDeliveryDateStr = String.valueOf(body.get("actualDeliveryDate"));
        LocalDate actualDeliveryDate = LocalDate.parse(actualDeliveryDateStr);

        serviceLevelAnalyticsService.confirmDelivery(id, actualDeliveryDate);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận ngày giao hàng thành công"));
    }
}
