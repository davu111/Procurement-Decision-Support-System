package com.ecotel.warehouse_service.service;

import com.ecotel.warehouse_service.dto.request.WarehouseRequest;
import com.ecotel.warehouse_service.dto.response.FullWarehouseResponse;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.dto.response.WarehouseResponse;
import com.ecotel.warehouse_service.mapper.WarehouseMapper;
import com.ecotel.warehouse_service.model.Warehouse;
import com.ecotel.warehouse_service.repository.WarehouseRepository;
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


    public WarehouseResponse create(WarehouseRequest warehouseRequest) {
        Warehouse warehouse = warehouseMapper.toWarehouse(warehouseRequest);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse update(String id, WarehouseRequest warehouseRequest) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouseMapper.updateWarehouseFromRequest(warehouseRequest, warehouse);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse deactivate(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouse.setActive(false);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }

    public WarehouseResponse active(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kho chứa không tồn tại"));
        warehouse.setActive(true);
        return warehouseMapper.toWarehouseResponse(warehouseRepository.save(warehouse));
    }
}
