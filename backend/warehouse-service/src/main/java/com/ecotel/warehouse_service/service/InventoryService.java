package com.ecotel.warehouse_service.service;

import com.ecotel.shared_library.service.ProductService;
import com.ecotel.warehouse_service.dto.request.TransactionRequest;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.enums.WorkType;
import com.ecotel.warehouse_service.mapper.InventoryMapper;
import com.ecotel.warehouse_service.model.Inventory;
import com.ecotel.warehouse_service.repository.InventoryRepository;
import com.ecotel.warehouse_service.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMapper inventoryMapper;
    private final ProductService productService;

    public List<InventoryResponse> getInventoryByProducts(List<String> productIds, String warehouseId) {
        System.out.println(productIds);
        System.out.println(warehouseId);
        Specification<Inventory> spec = (root, query, cb) ->
                root.get("productId").in(productIds);

        if (warehouseId != null && !warehouseId.equals("all")) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("warehouse").get("id"), warehouseId));
        }

        return inventoryRepository.findAll(spec).stream()
                .map(i -> {
                    System.out.println(i);
                    System.out.println(inventoryMapper.toInventoryResponse(i));
                    return inventoryMapper.toInventoryResponse(i);
                })
//                .map(inventoryMapper::toInventoryResponse)
                .collect(Collectors.toList());
    }

    // GET INVENTORY BY WAREHOUSE ID
    public List<InventoryResponse> getInventoryByWarehouseId(String warehouseId) {
        List<InventoryResponse> response = inventoryRepository.findByWarehouseId(warehouseId).stream()
                .map(inventoryMapper::toInventoryResponse)
                .toList();
        Map<String, String> productNames = productService.getProductNameByIds(
                response.stream().map(InventoryResponse::getProductId).toList()
        );
        response.forEach(r -> r.setProductName(productNames.get(r.getProductId())));

        return response;
    }

    // IMPORT/ EXPORT INVENTORY
    public List<InventoryResponse> importExportInventory(TransactionRequest request) {
        List<InventoryResponse> responses = new ArrayList<>();
        request.getProductQuantities().forEach((productId, quantity) -> {
            Inventory inventory = inventoryRepository.findByWarehouseIdAndProductId(
                            request.getWarehouseId(), productId)
                    .orElseGet(() -> {
                        Inventory newInventory = new Inventory();
                        newInventory.setWarehouse(
                                warehouseRepository.findById(request.getWarehouseId()).orElseThrow());
                        newInventory.setProductId(productId);
                        newInventory.setQuantity(BigDecimal.ZERO);
                        return newInventory;
                    });

            if (request.getWorkType() == WorkType.IMPORT) {
                inventory.increaseQuantity(quantity);
            } else{
                inventory.decreaseQuantity(quantity);
            }
            Inventory savedInventory = inventoryRepository.save(inventory);
            responses.add(inventoryMapper.toInventoryResponse(savedInventory));
        });
        return responses;
    }
}
