package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.Product;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.ProductRepository;
import com.ecotel.inventory_optimization_service.repository.WarehouseConfigRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse-config")
@RequiredArgsConstructor
public class WarehouseConfigController {

    private final WarehouseConfigRepository configRepository;
    private final ProductRepository productRepository;
    private final InventoryParameterRepository inventoryParameterRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseConfig>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(configRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseConfig>> create(
            @Valid @RequestBody WarehouseConfigRequest request) {

        // Lấy đơn giá trung bình để tính I nếu không truyền vào
        BigDecimal avgPrice = request.getAvgUnitPriceForCalculation();
        List<Long> productIds = productRepository.findByIsActiveTrue().stream().map(Product::getId).toList();
        if (avgPrice == null) {
            avgPrice = inventoryParameterRepository.findByProductIdIn(productIds).stream()
                    .map(InventoryParameter::getSnapshotUnitPriceC)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(Math.max(productRepository.findByIsActiveTrue().size(), 1)),
                            4, java.math.RoundingMode.HALF_UP);
        }

        WarehouseConfig config = WarehouseConfig.builder()
                .configName(request.getConfigName())
                .interestRate(request.getInterestRate())
                .warehouseMonthlyCost(request.getWarehouseMonthlyCost())
                .warehouseMaxCapacity(request.getWarehouseMaxCapacity())
                .spoilageRate(request.getSpoilageRate())
                .insuranceRate(request.getInsuranceRate())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .storageCostCoefficient(BigDecimal.ZERO) // sẽ tính lại
                .build();

        config.recalculateCoefficient(avgPrice);

        // Nếu set default → bỏ default của config cũ
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            configRepository.findByIsDefaultTrue().ifPresent(old -> {
                old.setIsDefault(false);
                configRepository.save(old);
            });
        }

        return ResponseEntity.ok(ApiResponse.success(
                configRepository.save(config),
                String.format("Đã tạo cấu hình kho. Hệ số I = %.4f (%.2f%%/kỳ)",
                        config.getStorageCostCoefficient(),
                        config.getStorageCostCoefficient().doubleValue() * 100)));
    }

    @GetMapping("/default")
    public ResponseEntity<ApiResponse<WarehouseConfig>> getDefault() {
        WarehouseConfig config = configRepository.findByIsDefaultTrue()
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có cấu hình kho mặc định"));
        return ResponseEntity.ok(ApiResponse.success(config));
    }
}
