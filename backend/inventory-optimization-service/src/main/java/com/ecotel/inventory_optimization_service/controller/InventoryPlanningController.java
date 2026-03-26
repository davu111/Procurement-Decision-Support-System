package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.ForecastSuggestionResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.dto.response.OrderScheduleResponse;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import com.ecotel.inventory_optimization_service.service.OrderScheduleService;
import com.ecotel.inventory_optimization_service.service.impl.InventoryPlanningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryPlanningController {

    private final InventoryPlanningService planningService;

    /**
     * POST /api/inventory/calculate
     * Nhập tham số + tính toán tối ưu + sinh lịch kế hoạch
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> calculate(
            @Valid @RequestBody InventoryParameterRequest request) {
        InventoryCalculationResult result = planningService.createAndCalculate(request);
        return ResponseEntity.ok(ApiResponse.success(result,
                "Tính toán thành công. Lịch kế hoạch đã được tạo."));
    }

    /**
     * GET /api/inventory/suggest/{productId}?planningUnit=MONTH
     * Lấy gợi ý tham số tự động từ lịch sử tiêu thụ
     */
    @GetMapping("/suggest/{productId}")
    public ResponseEntity<ApiResponse<ForecastSuggestionResponse>> getSuggestion(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "MONTH") PlanningUnit planningUnit) {
        ForecastSuggestionResponse suggestion = planningService.getSuggestion(productId, planningUnit);
        return ResponseEntity.ok(ApiResponse.success(suggestion));
    }
}
