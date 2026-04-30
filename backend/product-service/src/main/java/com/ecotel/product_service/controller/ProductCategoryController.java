package com.ecotel.product_service.controller;

import com.ecotel.product_service.dto.request.ProductCategoryRequest;
import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.service.ProductCategoryService;
import com.ecotel.shared_library.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/product-categories")
@RequiredArgsConstructor
public class ProductCategoryController {
    private final ProductCategoryService productCategoryService;

    @GetMapping("/{id}")
    public ApiResponse<ProductCategoryResponse> getProductCategory(String id) {
        ProductCategoryResponse response = productCategoryService.getProductCategoryById(id);
        return ApiResponse.<ProductCategoryResponse>builder()
                .message("Product category retrieved successfully")
                .data(response)
                .build();
    }

    @GetMapping
    public ApiResponse<List<ProductCategoryResponse>> getAllProductCategories() {
        List<ProductCategoryResponse> response = productCategoryService.getAllProductCategories();
        return ApiResponse.<List<ProductCategoryResponse>>builder()
                .message("Product categories retrieved successfully")
                .data(response)
                .build();
    }

    @PostMapping
    public ApiResponse<ProductCategoryResponse> create(@Valid @RequestBody ProductCategoryRequest request) {
        ProductCategoryResponse result = productCategoryService.createProductCategory(request);
        return ApiResponse.<ProductCategoryResponse>builder()
                .message("Create product category successfully")
                .data(result)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductCategoryResponse> update(
            @PathVariable String id, @Valid @RequestBody ProductCategoryRequest request) {
        ProductCategoryResponse result = productCategoryService.update(id, request);
        return ApiResponse.<ProductCategoryResponse>builder()
                .message("Update product category successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/deactivate/{id}")
    public ApiResponse<ProductCategoryResponse> deactivate(@PathVariable String id) {
        ProductCategoryResponse result = productCategoryService.deactivate(id);
        return ApiResponse.<ProductCategoryResponse>builder()
                .message("Deactive product category successfully")
                .data(result)
                .build();
    }

    @PatchMapping("/activate/{id}")
    public ApiResponse<ProductCategoryResponse> activate(@PathVariable String id) {
        ProductCategoryResponse result = productCategoryService.active(id);
        return ApiResponse.<ProductCategoryResponse>builder()
                .message("Active product category successfully")
                .data(result)
                .build();
    }
}
