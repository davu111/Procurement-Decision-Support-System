package com.ecotel.warehouse_service.controller;

import com.ecotel.warehouse_service.dto.request.TransactionRequest;
import com.ecotel.warehouse_service.dto.response.ApiResponse;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/inventories")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/by-products")
    public ApiResponse<List<InventoryResponse>> getInventoryByProducts(
            @RequestBody List<String> productIds,
            @RequestParam(defaultValue = "all") String warehouseId,
            @RequestParam(defaultValue = "all") String siteId) {
        List<InventoryResponse> response = inventoryService.getInventoryByProducts(productIds, warehouseId, siteId);
        return ApiResponse.<List<InventoryResponse>>builder()
                .message("Inventory by products retrieved successfully")
                .data(response)
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
