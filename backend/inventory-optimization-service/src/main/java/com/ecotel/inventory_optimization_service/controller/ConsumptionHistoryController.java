package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.inventory_optimization_service.service.ConsumptionHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consumption-history")
@RequiredArgsConstructor
public class ConsumptionHistoryController {

    private final ConsumptionHistoryRepository historyRepository;
    private final ConsumptionHistoryService consumptionHistoryService;

    /**
     * POST /api/consumption-history
     * Nhập dữ liệu tiêu thụ thực tế sau mỗi kỳ
     * → Đây là nền tảng cho hệ thống đề xuất tự động
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ConsumptionHistoryResponse>> record(
            @Valid @RequestBody ConsumptionHistoryRequest request) {
        ConsumptionHistoryResponse saved = consumptionHistoryService.record(request);

        int totalPoints = historyRepository.countByProductIdAndPlanningUnit(
                request.getProductId(), request.getPlanningUnit());

        String message = String.format(
                "Đã lưu dữ liệu tiêu thụ. Tổng số điểm dữ liệu: %d. %s",
                totalPoints, getModelReadinessMessage(totalPoints));
        return ResponseEntity.ok(ApiResponse.success(saved, message));
    }

    /**
     * GET /api/consumption-history/{productId}?planningUnit=MONTH
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<ConsumptionHistoryResponse>>> getHistory(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "MONTH") PlanningUnit planningUnit) {
        List<ConsumptionHistoryResponse> history = consumptionHistoryService.getHistory(productId, planningUnit);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    private String getModelReadinessMessage(int count) {
        if (count < 6) return String.format("Cần %d điểm nữa để dùng Holt-Winters.", 6 - count);
        if (count < 18) return String.format("Cần %d điểm nữa để dùng Seasonal Regression.", 18 - count);
        return "Đang dùng mô hình Seasonal Regression - độ chính xác cao nhất.";
    }
}
