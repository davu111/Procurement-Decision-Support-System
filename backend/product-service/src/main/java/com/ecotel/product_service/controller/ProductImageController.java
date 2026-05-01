package com.ecotel.product_service.controller;

import com.ecotel.product_service.service.MinioService;
import com.ecotel.product_service.service.ProductImageService;
import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-images")
@RequiredArgsConstructor
public class ProductImageController {
    private final ProductImageService productImageService;
    private final MinioService minioService;

    @GetMapping("/{productId}")
    public ApiResponse<String> getProductImages(@PathVariable String productId) {
        System.out.println("Fetching image for productId: " + productId);
        return ApiResponse.<String>builder()
                .message("Product images retrieved successfully")
                .data(minioService.getImageUrl(productId))
                .build();
    }

    @PostMapping("/batch-urls")
    public ApiResponse<Map<String, String>> getProductImagesBatch(@RequestBody List<String> productIds) {
        Map<String, String> result = minioService.getImageUrls(productIds);

        return ApiResponse.<Map<String, String>>builder()
                .message("Product images retrieved successfully")
                .data(result)
                .build();
    }

    // UPLOAD IMAGE
    @PostMapping("/upload/{productId}")
    public ApiResponse<?> uploadProductImage(
            @PathVariable String productId,
            @RequestParam("file") MultipartFile file
    ) {
        // Upload to MinIO and save to ProductImage table
        minioService.uploadProductImage(productId, file);
        return ApiResponse.<String>builder()
                .message("Product image uploaded successfully")
                .build();
    }
}
