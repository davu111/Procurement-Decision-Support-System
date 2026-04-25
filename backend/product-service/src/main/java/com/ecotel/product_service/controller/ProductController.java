package com.ecotel.product_service.controller;

import com.ecotel.product_service.dto.request.ProductRequest;
import com.ecotel.product_service.dto.response.ApiResponse;
import com.ecotel.product_service.dto.response.ProductInventoryResponse;
import com.ecotel.product_service.dto.response.ProductResponse;
import com.ecotel.product_service.enums.ProductStatus;
import com.ecotel.product_service.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "all") String categoryId,
            @RequestParam(required = false) ProductStatus status
    ) {
        return ApiResponse.<List<ProductResponse>>builder()
                .message("Products retrieved successfully")
                .data(productService.getProducts(categoryId, status))
                .build();
    }

    @GetMapping("/grouped-inventory")
    public ApiResponse<ProductInventoryResponse> getGroupedInventory(
            @RequestParam(defaultValue = "all") String categoryId,
            @RequestParam(defaultValue = "all") String warehouseId,
            @RequestParam(defaultValue = "all") String siteId,
            @RequestParam(required = false) ProductStatus status
    ) {
        ProductInventoryResponse response = productService.getGroupedInventory(categoryId, warehouseId, siteId, status);
        return ApiResponse.<ProductInventoryResponse>builder()
                .message("Grouped inventory retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable String id) {
        ProductResponse response = productService.getProductById(id);
        return ApiResponse.<ProductResponse>builder()
                .message("Product retrieved successfully")
                .data(response)
                .build();
    }

    // GET PRODUCT NAME BY ID
    @GetMapping("/name/{productId}")
    public ApiResponse<String> getProductNameById(@PathVariable String productId) {
        String productName = productService.getProductNameById(productId);
        return ApiResponse.<String>builder()
                .message("Product name retrieved successfully")
                .data(productName)
                .build();
    }

    @PostMapping
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.create(request);
        return ApiResponse.<ProductResponse>builder()
                .message("Create product successfully")
                .data(result)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(
            @PathVariable String id, @Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.update(id, request);
        return ApiResponse.<ProductResponse>builder()
                .message("Update product successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/deactivate/{id}")
    public ApiResponse<ProductResponse> deactivate(@PathVariable String id) {
        ProductResponse result = productService.deactivate(id);
        return ApiResponse.<ProductResponse>builder()
                .message("Deactive product successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/activate/{id}")
    public ApiResponse<ProductResponse> activate(@PathVariable String id) {
        ProductResponse result = productService.active(id);
        return ApiResponse.<ProductResponse>builder()
                .message("Active product successfully")
                .data(result)
                .build();
    }
}
