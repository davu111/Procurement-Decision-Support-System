package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.BatchUpdateRequest;
import com.ecotel.inventory_optimization_service.dto.response.ActualDatesResponse;
import com.ecotel.inventory_optimization_service.dto.response.BatchUpdateResponse;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.service.InventoryParameterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory-parameters")
@RequiredArgsConstructor
@Slf4j
public class InventoryParameterController {

    private final InventoryParameterRepository parameterRepository;
    private final InventoryParameterService actualDatesService;

    /**
     * Cập nhật actual dates cho một parameter cụ thể
     * PUT /api/inventory-parameters/{id}/actual-dates
     */
    @PutMapping("/{id}/actual-dates")
    public ResponseEntity<ActualDatesResponse> updateActualDates(@PathVariable Long id) {
        try {
            actualDatesService.updateActualDates(id);

            InventoryParameter param = parameterRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Parameter not found"));

            ActualDatesResponse response = ActualDatesResponse.builder()
                    .parameterId(id)
                    .planStartDate(param.getPlanStartDate())
                    .planEndDate(param.getPlanEndDate())
                    .actualFirstOrderDate(param.getActualFirstOrderDate())
                    .actualEndDate(param.getActualEndDate())
                    .updatedAt(LocalDateTime.now())
                    .build();

            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating actual dates for parameter {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Cập nhật actual dates cho nhiều parameters
     * POST /api/inventory-parameters/batch-update-actual-dates
     */
    @PostMapping("/batch-update-actual-dates")
    public ResponseEntity<BatchUpdateResponse> batchUpdateActualDates(
            @RequestBody BatchUpdateRequest request) {
        try {
            actualDatesService.batchUpdateActualDates(request.getParameterIds());

            BatchUpdateResponse response = BatchUpdateResponse.builder()
                    .totalProcessed(request.getParameterIds().size())
                    .successCount(request.getParameterIds().size())
                    .updatedAt(LocalDateTime.now())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error batch updating actual dates: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Cập nhật actual dates cho tất cả parameters của một product
     * PUT /api/inventory-parameters/product/{productId}/actual-dates
     */
    @PutMapping("/product/{productId}/actual-dates")
    public ResponseEntity<BatchUpdateResponse> updateActualDatesByProduct(
            @PathVariable String productId) {
        try {
            List<InventoryParameter> parameters = parameterRepository
                    .findByProductIdAndStatus(productId, List.of("ACTIVE", "SUPERSEDED"));

            List<Long> parameterIds = parameters.stream()
                    .map(InventoryParameter::getId)
                    .toList();

            actualDatesService.batchUpdateActualDates(parameterIds);

            BatchUpdateResponse response = BatchUpdateResponse.builder()
                    .totalProcessed(parameterIds.size())
                    .successCount(parameterIds.size())
                    .updatedAt(LocalDateTime.now())
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating actual dates for product {}: {}", productId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
