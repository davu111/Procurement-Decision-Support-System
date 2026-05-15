package com.ecotel.warehouse_service.controller;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.warehouse_service.dto.request.TransactionRequest;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("api/inventories")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/by-products")
    public ApiResponse<List<InventoryResponse>> getInventoryByProducts(
            @RequestBody List<String> productIds,
            @RequestParam(defaultValue = "all") String warehouseId) {
        List<InventoryResponse> response = inventoryService.getInventoryByProducts(productIds, warehouseId);
        return ApiResponse.<List<InventoryResponse>>builder()
                .message("Inventory by products retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping("/quantity/{productId}")
    public ApiResponse<BigDecimal> getTotalQuantityByProductId(@PathVariable String productId) {
        BigDecimal totalQuantity = inventoryService.getQuantityByProductId(productId);
        return ApiResponse.<BigDecimal>builder()
                .message("Total quantity retrieved successfully")
                .data(totalQuantity)
                .build();
    }

    @PutMapping("/transfer")
    public ApiResponse<List<InventoryResponse>> transferInventory(@RequestBody TransactionRequest request){
        List<InventoryResponse> response = inventoryService.importExportInventory(request);
        return ApiResponse.<List<InventoryResponse>>builder()
                .message("Inventory transferred successfully")
                .data(response)
                .build();
    }
}
