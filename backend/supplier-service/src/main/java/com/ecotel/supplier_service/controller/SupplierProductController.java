package com.ecotel.supplier_service.controller;

import com.ecotel.supplier_service.dto.request.SupplierProductRequest;
import com.ecotel.supplier_service.dto.request.SupplierProductUpdateRequest;
import com.ecotel.supplier_service.dto.response.ApiResponse;
import com.ecotel.supplier_service.dto.response.SupplierProductResponse;
import com.ecotel.supplier_service.service.SupplierProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class SupplierProductController {

    private final SupplierProductService supplierProductService;

    // --- Nested under /api/suppliers/{supplierId}/products ---

    @GetMapping("/api/suppliers/{supplierId}/products")
    public ResponseEntity<ApiResponse<List<SupplierProductResponse>>> getBySupplierId(
            @PathVariable String supplierId) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProductService.getBySupplierId(UUID.fromString(supplierId))));
    }

    @PostMapping("/api/suppliers/{supplierId}/products")
    public ResponseEntity<ApiResponse<SupplierProductResponse>> create(
            @PathVariable String supplierId,
            @Valid @RequestBody SupplierProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProductService.create(UUID.fromString(supplierId), request),
                "Thêm sản phẩm cho nhà cung cấp thành công"));
    }

    // --- Standalone /api/supplier-products ---

    @GetMapping("/api/supplier-products/{id}")
    public ResponseEntity<ApiResponse<SupplierProductResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(supplierProductService.getById(UUID.fromString(id))));
    }

    /**
     * Inventory Service gọi endpoint này khi tạo kỳ kế hoạch mới.
     * GET /api/supplier-products/by-product/{productId}
     * Trả về K, A, C, L của sản phẩm từ nhà cung cấp đang active.
     */
    @GetMapping("/api/supplier-products/by-product/{productId}")
    public ResponseEntity<ApiResponse<SupplierProductResponse>> getByProductId(
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProductService.getByProductId(productId)));
    }

    @PutMapping("/api/supplier-products/{id}")
    public ResponseEntity<ApiResponse<SupplierProductResponse>> update(
            @Valid @RequestBody SupplierProductUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProductService.update(request), "Cập nhật thành công"));
    }

    @DeleteMapping("/api/supplier-products/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable String id) {
        supplierProductService.deactivate(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.success(null, "Đã vô hiệu hóa"));
    }
}
