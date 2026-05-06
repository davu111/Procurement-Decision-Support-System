package com.ecotel.product_service.controller;

import com.ecotel.product_service.dto.request.ProductRequest;
import com.ecotel.product_service.dto.response.ProductInventoryResponse;
import com.ecotel.product_service.dto.response.ProductResponse;
import com.ecotel.product_service.enums.ProductStatus;
import com.ecotel.product_service.service.ProductService;
import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.shared_library.dto.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/all")
    public ApiResponse<List<ProductResponse>> getProducts(
            @RequestParam(defaultValue = "all") String categoryId,
            @RequestParam(required = false) ProductStatus status
    ) {
        return ApiResponse.<List<ProductResponse>>builder()
                .message("Products retrieved successfully")
                .data(productService.getProducts(categoryId, status))
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> getProductsPage(
            @RequestParam(defaultValue = "all") String categoryId,
            @RequestParam(required = false) ProductStatus status,
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "productName",
                    direction = Sort.Direction.ASC
            ) Pageable pageable
    ) {
        return ApiResponse.<PageResponse<ProductResponse>>builder()
                .message("Products page retrieved successfully")
                .data(productService.getProductsPage(categoryId, status, pageable))
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

    // GET MAP<ID, PRODUCT RESPONSE> BY IDS
    @PostMapping("/get-map-products")
    public ApiResponse<Map<String, ProductResponse>> getProductMapByIds(@RequestBody List<String> productIds) {
        Map<String, ProductResponse> response = productService.getProductMapByIds(productIds);
        return ApiResponse.<Map<String, ProductResponse>>builder()
                .message("Product map retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping("/get-active")
    public ApiResponse<List<ProductResponse>> getActive(){
        List<ProductResponse> responses = productService.getIsActiveTrue();

        return ApiResponse.<List<ProductResponse>>builder()
                .message("Product active retrieved successfully")
                .data(responses)
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

    // GET PRODUCT NAMES BY IDS
    @PostMapping("/names")
    public ApiResponse<Map<String,String>> getProductNameByIds(@RequestBody List<String> productIds) {
        Map<String, String> productNames = productService.getProductNameByIds(productIds);
        return ApiResponse.<Map<String,String>>builder()
                .message("Product names retrieved successfully")
                .data(productNames)
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
