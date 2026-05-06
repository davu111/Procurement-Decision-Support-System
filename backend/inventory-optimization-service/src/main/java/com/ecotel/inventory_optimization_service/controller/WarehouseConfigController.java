package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigRequest;
import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigUpdateRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.WarehouseConfigResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.WarehouseConfigRepository;
import com.ecotel.inventory_optimization_service.service.WarehouseConfigService;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse-config")
@RequiredArgsConstructor
public class WarehouseConfigController {

    private final WarehouseConfigService warehouseConfigService;

    @GetMapping
    public ApiResponse<List<WarehouseConfigResponse>> getAll() {
        return ApiResponse.<List<WarehouseConfigResponse>>builder()
                .success(true)
                .message("Get all warehouse config successful")
                .data(warehouseConfigService.getAll())
                .build();
    }

    @GetMapping("/{warehouseConfigId}")
    public ApiResponse<WarehouseConfigResponse> getById(@PathVariable Long warehouseConfigId) {
        return  ApiResponse.<WarehouseConfigResponse>builder()
                .success(true)
                .message("Get warehouse config with id successful")
                .data(warehouseConfigService.getById(warehouseConfigId))
                .build();
    }

    @GetMapping("/product/{productId}")
    public ApiResponse<WarehouseConfigResponse> getConfigByProductId(@PathVariable String productId) {
        WarehouseConfigResponse response = warehouseConfigService.getConfigByProductId(productId);
        return  ApiResponse.<WarehouseConfigResponse>builder()
                .success(true)
                .message("Get warehouse config with product id successful")
                .data(response)
                .build();
    }


    @PostMapping
    public ApiResponse<WarehouseConfigResponse> create(
            @Valid @RequestBody WarehouseConfigRequest request) {
        return ApiResponse.<WarehouseConfigResponse>builder()
                .success(true)
                .message("Create warehouse config successful")
                .data(warehouseConfigService.create(request))
                .build();
    }

    @PutMapping
    public ApiResponse<WarehouseConfigResponse> update(
            @Valid @RequestBody WarehouseConfigUpdateRequest request) {
        return ApiResponse.<WarehouseConfigResponse>builder()
                .success(true)
                .message("Update warehouse config successful")
                .data(warehouseConfigService.update(request))
                .build();
    }
}
