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
import com.ecotel.inventory_optimization_service.service.impl.PeriodResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryPlanningController {

    private final InventoryPlanningService planningService;
    private final OrderScheduleRepository scheduleRepository;

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
     * GET /api/inventory/resolve-period?planningUnit=MONTH&targetPeriod=4&targetYear=2025
     *
     * Frontend gọi trước khi submit form để:
     *   1. Validate kỳ được chọn không phải quá khứ
     *   2. Hiển thị preview planStartDate và scheduleStartDate cho người dùng biết
     */
    @GetMapping("/resolve-period")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolvePeriod(
            @RequestParam PlanningUnit planningUnit,
            @RequestParam Integer targetPeriod,
            @RequestParam Integer targetYear) {

        LocalDate today = LocalDate.now();

        // Tạo request tạm để dùng PeriodResolver
        InventoryParameterRequest temp = InventoryParameterRequest.builder()
                .planningUnit(planningUnit)
                .targetPeriod(targetPeriod)
                .targetYear(targetYear)
                .build();

        try {
            PeriodResolver.validateNotPast(temp, today);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }

        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(temp, today);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "planStartDate",     resolved.planStartDate().toString(),
                "scheduleStartDate", resolved.scheduleStartDate().toString(),
                "isCurrentPeriod",   resolved.scheduleStartDate().equals(today)
        )));
    }

    @GetMapping("/suggest/{productId}")
    public ResponseEntity<ApiResponse<ForecastSuggestionResponse>> getSuggestion(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "MONTH") PlanningUnit planningUnit) {
        return ResponseEntity.ok(ApiResponse.success(
                planningService.getSuggestion(productId, planningUnit)));
    }

    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<?>>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                scheduleRepository.findByOrderDateBetween(from, to)));
    }

    @GetMapping("/schedule/{productId}")
    public ResponseEntity<ApiResponse<List<?>>> getScheduleByProduct(
            @PathVariable Long productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                scheduleRepository.findByProductIdAndOrderDateBetween(productId, from, to)));
    }
}
