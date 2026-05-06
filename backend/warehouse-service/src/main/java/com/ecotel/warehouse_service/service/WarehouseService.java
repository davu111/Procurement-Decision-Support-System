package com.ecotel.warehouse_service.service;

import com.ecotel.warehouse_service.dto.request.WarehouseConfigRequest;
import com.ecotel.warehouse_service.dto.request.WarehouseRequest;
import com.ecotel.warehouse_service.dto.request.WarehouseUpdateRequest;
import com.ecotel.warehouse_service.dto.response.FullWarehouseResponse;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseConfigResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseResponse;
import com.ecotel.warehouse_service.mapper.WarehouseMapper;
import com.ecotel.warehouse_service.model.Warehouse;
import com.ecotel.warehouse_service.repository.WarehouseRepository;
import com.ecotel.warehouse_service.service.external.WarehouseConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    private final WarehouseMapper warehouseMapper;

    private final InventoryService inventoryService;
    private final WarehouseConfigService warehouseConfigService;

    // GET BY ID
    public WarehouseResponse getWarehouseById(String warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .map(warehouseMapper::toWarehouseResponse)
                .orElse(null);
    }

    // GET BY ID BATCH
    public List<WarehouseResponse> getWarehousesByIds(List<String> warehouseIds) {
        return warehouseRepository.findAllById(warehouseIds).stream()
                .map(warehouseMapper::toWarehouseResponse)
                .toList();
    }

    // GET ALL
    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(warehouseMapper::toWarehouseResponse)
                .toList();
    }

    // GET FULL WAREHOUSES INFO
    public List<FullWarehouseResponse> getFullWarehousesInfo() {
        return warehouseRepository.findAll().stream()
                .map(warehouse -> {
                    return getFullWarehouseInfoById(warehouse.getId());
                })
                .toList();
    }

    // GET FULL WAREHOUSE INFO BY ID
    public FullWarehouseResponse getFullWarehouseInfoById(String warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .map(warehouse -> {
                    FullWarehouseResponse response = warehouseMapper.toFullWarehouseResponse(warehouse);

                    List<InventoryResponse> inventoryResponses = inventoryService.getInventoryByWarehouseId(warehouse.getId());
                    response.setInventories(inventoryResponses);
                    response.setTotalInventory(BigDecimal.valueOf(inventoryResponses.size()));
                    BigDecimal totalItems = inventoryResponses.stream()
                            .map(InventoryResponse::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    response.setItems(totalItems);
                    return response;
                })
                .orElse(null);
    }

    // GET WAREHOUSE NAME BY ID
    public String getWarehouseNameById(String warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .map(Warehouse::getWarehouseName)
                .orElse(null);
    }
    // GET WAREHOUSE FULL - INFO BY CONFIG ID
    public FullWarehouseResponse getWarehouseFullInfoByConfigId(Long configId){
        Warehouse warehouse = warehouseRepository.findByConfigId(configId)
                .orElseThrow(() -> new RuntimeException(
                "Warehouse not found for configId=" + configId));

        return getFullWarehouseInfoById(warehouse.getId());
    }


    public WarehouseResponse create(WarehouseRequest warehouseRequest) {
        Warehouse warehouse = warehouseMapper.toWarehouse(warehouseRequest);

        WarehouseConfigRequest warehouseConfigRequest = warehouseRequest.getWarehouseConfigRequest();
        WarehouseConfigResponse warehouseConfigResponse = warehouseConfigService.create(warehouseConfigRequest);
        warehouse.setConfigId(warehouseConfigResponse.getId());

        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse update(WarehouseUpdateRequest warehouseRequest) {
        Warehouse warehouse = warehouseRepository.findById(warehouseRequest.getId())
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouseMapper.updateWarehouseFromRequest(warehouseRequest, warehouse);
        warehouseConfigService.update(warehouseRequest.getWarehouseConfigUpdateRequest());
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse deactivate(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouse.setIsActive(false);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse active(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouse.setIsActive(true);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }
}
