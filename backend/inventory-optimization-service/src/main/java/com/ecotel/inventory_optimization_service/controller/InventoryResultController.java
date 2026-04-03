package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.service.InventoryResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/inventory-results")
@RequiredArgsConstructor
public class InventoryResultController {
    private final InventoryResultService resultService;

    @GetMapping("/latest/{productId}")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> getLatestResult(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "MONTH") PlanningUnit planningUnit
    ) {
        InventoryCalculationResult result = resultService.getInventoryResultLatestByProductIdAndPlanningUnit(productId, planningUnit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/range/{productId}")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> getInventoryResultRange(
            @PathVariable Long productId,
            @RequestParam PlanningUnit planningUnit,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        InventoryCalculationResult result = resultService.getInventoryResultByProductIdAndPlanStartDateBetweenAndPlanningUnit(productId, planningUnit, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
