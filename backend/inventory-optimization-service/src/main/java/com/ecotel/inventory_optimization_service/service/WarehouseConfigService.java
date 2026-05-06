package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigRequest;
import com.ecotel.inventory_optimization_service.dto.request.WarehouseConfigUpdateRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.WarehouseConfigResponse;
import com.ecotel.inventory_optimization_service.dto.response.warehouse.InventoryResponse;
import com.ecotel.inventory_optimization_service.dto.response.warehouse.FullWarehouseResponse;
import com.ecotel.inventory_optimization_service.mapper.WarehouseConfigMapper;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.WarehouseConfigRepository;
import com.ecotel.inventory_optimization_service.service.warehouse.WarehouseServiceClient;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseConfigService {
    private final WarehouseConfigRepository warehouseConfigRepository;
    private final WarehouseConfigMapper warehouseConfigMapper;
    private final ProductService productService;
    private final WarehouseServiceClient warehouseServiceClient;
    private final InventoryParameterRepository inventoryParameterRepository;

    public List<WarehouseConfigResponse> getAll(){
        List<WarehouseConfig> warehouseConfigs = warehouseConfigRepository.findAll();

        warehouseConfigs.forEach(config -> {
            if(config.getStorageCostCoefficient() == null){
                BigDecimal avgPrice = calculateAvgPrice(config.getId());
                config.recalculateCoefficient(avgPrice);
            }
        });

        return warehouseConfigs.stream()
                .map(warehouseConfigMapper::toResponse)
                .toList();
    }

    public WarehouseConfigResponse getById(Long warehouseConfigId){
        WarehouseConfig warehouseConfig = warehouseConfigRepository.findById(warehouseConfigId)
                .orElseThrow(() -> new RuntimeException("Not found warehouse config with id: " + warehouseConfigId));

        if(warehouseConfig.getStorageCostCoefficient() == null){
            BigDecimal avgPrice = calculateAvgPrice(warehouseConfig.getId());
            warehouseConfig.recalculateCoefficient(avgPrice);
        }


        return warehouseConfigMapper.toResponse(warehouseConfig);
    }

    public WarehouseConfigResponse create(WarehouseConfigRequest request){
        WarehouseConfig config = WarehouseConfig.builder()
                .interestRate(request.getInterestRate())
                .warehouseMonthlyCost(request.getWarehouseMonthlyCost())
                .warehouseMaxCapacity(request.getWarehouseMaxCapacity())
                .spoilageRate(request.getSpoilageRate())
                .insuranceRate(request.getInsuranceRate())
                .storageCostCoefficient(BigDecimal.ZERO) // sẽ tính lại
                .build();

        return warehouseConfigMapper.toResponse(warehouseConfigRepository.save(config));
    }

    public WarehouseConfigResponse update(WarehouseConfigUpdateRequest request) {
        WarehouseConfig warehouseConfig = warehouseConfigRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Not found warehouse config with id: " + request.getId()));

        warehouseConfigMapper.update(request, warehouseConfig);

        try {
            BigDecimal avgPrice = calculateAvgPrice(warehouseConfig.getId());
            warehouseConfig.recalculateCoefficient(avgPrice);
        } catch (Exception e) {
            log.error("Error calculating avg price for warehouse config id: {}", warehouseConfig.getId(), e);
            throw new RuntimeException("Failed to calculate average price: " + e.getMessage(), e);
        }

        return warehouseConfigMapper.toResponse(warehouseConfigRepository.save(warehouseConfig));
    }

    private BigDecimal calculateAvgPrice(Long configId) {
        log.info("Calculating average price for warehouse config: {}", configId);
        
        FullWarehouseResponse fullWarehouse = warehouseServiceClient.getFullWarehouseInfoByConfigId(configId);
        if (fullWarehouse == null) {
            log.warn("FullWarehouse is null for config id: {}", configId);
            return BigDecimal.ZERO;
        }
        
        if (fullWarehouse.getInventories() == null || fullWarehouse.getInventories().isEmpty()) {
            log.warn("No inventories found for warehouse config id: {}", configId);
            return BigDecimal.ZERO;
        }
        
        List<String> productIds = fullWarehouse.getInventories().stream()
                .map(InventoryResponse::getProductId)
                .toList();
        log.info("Product IDs: {}", productIds);
        
        return inventoryParameterRepository.findByProductIdIn(productIds).stream()
                .map(InventoryParameter::getSnapshotUnitPriceC)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(productService.getActiveTrue().size(), 1)),
                        4, java.math.RoundingMode.HALF_UP);
    }
}
