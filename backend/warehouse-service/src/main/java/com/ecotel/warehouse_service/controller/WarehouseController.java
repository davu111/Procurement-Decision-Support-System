package com.ecotel.warehouse_service.controller;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.warehouse_service.dto.request.WarehouseRequest;
import com.ecotel.warehouse_service.dto.response.FullWarehouseResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseResponse;
import com.ecotel.warehouse_service.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;

    @GetMapping("/{id}")
    public ApiResponse<WarehouseResponse> getWarehouse(@PathVariable String id) {
        WarehouseResponse response = warehouseService.getWarehouseById(id);
        return ApiResponse.<WarehouseResponse>builder()
                .message("Warehouse retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping
    public ApiResponse<List<WarehouseResponse>> getAllWarehouses() {
        List<WarehouseResponse> response = warehouseService.getAllWarehouses();
        return ApiResponse.<List<WarehouseResponse>>builder()
                .message("Warehouses retrieved successfully")
                .data(response)
                .build();
    }

    @PostMapping("/batch")
    public ApiResponse<List<WarehouseResponse>> getWarehouses(
            @RequestBody List<String> ids) {
        List<WarehouseResponse> response = warehouseService.getWarehousesByIds(ids);
        return ApiResponse.<List<WarehouseResponse>>builder()
                .message("Warehouses retrieved successfully")
                .data(response)
                .build();
    }

    // GET FULL WAREHOUSES INFO
    @GetMapping("/full-info")
    public ApiResponse<List<FullWarehouseResponse>> getFullWarehousesInfo() {
        List<FullWarehouseResponse> response = warehouseService.getFullWarehousesInfo();
        return ApiResponse.<List<FullWarehouseResponse>>builder()
                .message("Full warehouses info retrieved successfully")
                .data(response)
                .build();
    }

    // GET FULL WAREHOUSE INFO BY ID
    @GetMapping("/full-info/{id}")
    public ApiResponse<FullWarehouseResponse> getFullWarehouseInfoById(@PathVariable String id) {
        FullWarehouseResponse response = warehouseService.getFullWarehouseInfoById(id);
        return ApiResponse.<FullWarehouseResponse>builder()
                .message("Full warehouse info retrieved successfully")
                .data(response)
                .build();
    }

    // GET WAREHOUSE NAME BY ID
    @GetMapping("/name/{warehouseId}")
    public ApiResponse<String> getWarehouseNameById(@PathVariable String warehouseId) {
        String warehouseName = warehouseService.getWarehouseNameById(warehouseId);
        return ApiResponse.<String>builder()
                .message("Get warehouse name by ID successful")
                .data(warehouseName)
                .build();
    }

    @PostMapping
    public ApiResponse<WarehouseResponse> create(@Valid @RequestBody WarehouseRequest request) {
        WarehouseResponse result = warehouseService.create(request);
        return ApiResponse.<WarehouseResponse>builder()
                .message("Create warehouse successfully")
                .data(result)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<WarehouseResponse> update(
            @PathVariable String id, @Valid @RequestBody WarehouseRequest request) {
        WarehouseResponse result = warehouseService.update(id, request);
        return ApiResponse.<WarehouseResponse>builder()
                .message("Update warehouse successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/deactivate/{id}")
    public ApiResponse<WarehouseResponse> deactivate(@PathVariable String id) {
        WarehouseResponse result = warehouseService.deactivate(id);
        return ApiResponse.<WarehouseResponse>builder()
                .message("Deactive warehouse successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/activate/{id}")
    public ApiResponse<WarehouseResponse> activate(@PathVariable String id) {
        WarehouseResponse result = warehouseService.active(id);
        return ApiResponse.<WarehouseResponse>builder()
                .message("Active warehouse successfully")
                .data(result)
                .build();
    }
}
