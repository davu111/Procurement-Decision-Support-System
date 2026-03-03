package com.ecotel.product_service.controller;

import com.ecotel.product_service.dto.response.ApiResponse;
import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.service.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
