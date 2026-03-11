package com.ecotel.supplier_service.controller;

import com.ecotel.supplier_service.dto.request.SupplierRequest;
import com.ecotel.supplier_service.dto.request.SupplierUpdateRequest;
import com.ecotel.supplier_service.dto.response.ApiResponse;
import com.ecotel.supplier_service.dto.response.SupplierResponse;
import com.ecotel.supplier_service.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getById(UUID.fromString(id))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SupplierResponse>> create(
            @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierService.create(request), "Tạo nhà cung cấp thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(@Valid @RequestBody SupplierUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierService.update(request), "Cập nhật thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable String id) {
        supplierService.deactivate(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.success(null, "Đã vô hiệu hóa nhà cung cấp"));
    }
}
