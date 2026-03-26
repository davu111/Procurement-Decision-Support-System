package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.service.InventoryResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
