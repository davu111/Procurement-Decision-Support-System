package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.ProductRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.ProductResponse;
import com.ecotel.inventory_optimization_service.repository.ProductRepository;
import com.ecotel.inventory_optimization_service.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll() {
        List<ProductResponse> result = productService.getAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        ProductResponse result = productService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.create(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Tạo mặt hàng thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse result = productService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(result, "Cập nhật thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> deactivate(@PathVariable Long id) {
        ProductResponse result = productService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Đã vô hiệu hóa mặt hàng"));
    }
}
