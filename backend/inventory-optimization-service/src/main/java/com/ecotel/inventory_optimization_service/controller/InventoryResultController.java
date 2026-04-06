package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
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
            @PathVariable Long productId
    ) {
        InventoryCalculationResult result = resultService.getInventoryResultLatestByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/range/{productId}")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> getInventoryResultRange(
            @PathVariable Long productId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        InventoryCalculationResult result = resultService.getInventoryResultByProductIdAndPlanStartDateBetween(productId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
