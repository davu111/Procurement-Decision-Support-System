package com.ecotel.warehouse_service.service;

import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import com.ecotel.warehouse_service.dto.request.TransactionRequest;
import com.ecotel.warehouse_service.dto.response.InventoryResponse;
import com.ecotel.warehouse_service.enums.WorkType;
import com.ecotel.warehouse_service.exception.AppException;
import com.ecotel.warehouse_service.exception.ErrorCode;
import com.ecotel.warehouse_service.mapper.InventoryMapper;
import com.ecotel.warehouse_service.model.Inventory;
import com.ecotel.warehouse_service.model.Warehouse;
import com.ecotel.warehouse_service.repository.InventoryRepository;
import com.ecotel.warehouse_service.repository.WarehouseRepository;
import com.ecotel.warehouse_service.service.external.WarehouseConfigService;
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
    private final WarehouseConfigService warehouseConfigService;

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
    // GET QUANTITY BY PRODUCT ID
    public BigDecimal getQuantityByProductId(String productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new RuntimeException("Not found inventory with product id: " + productId));
        return inventory.getQuantity();
    }

    // GET INVENTORY BY WAREHOUSE ID
    public List<InventoryResponse> getInventoryByWarehouseId(String warehouseId) {
        List<InventoryResponse> response = inventoryRepository.findByWarehouseId(warehouseId).stream()
                .map(inventoryMapper::toInventoryResponse)
                .toList();
        Map<String, ProductResponse> products = productService.getProductMapByIds(
                response.stream().map(InventoryResponse::getProductId).toList()
        );
        response.forEach(r -> {
            if (products.get(r.getProductId()) == null) System.out.println(r.getProductId());
            r.setProductName(products.get(r.getProductId()).getProductName());
            r.setUnit(products.get(r.getProductId()).getUnit());
        });

        return response;
    }

    // IMPORT/ EXPORT INVENTORY
    public List<InventoryResponse> importExportInventory(TransactionRequest request) {
        List<InventoryResponse> responses = new ArrayList<>();

        // Lấy thông tin warehouse một lần, dùng chung cho tất cả sản phẩm
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.WAREHOUSE_NOT_FOUND));

        request.getProductQuantities().forEach((productId, quantity) -> {

            if (request.getWorkType() == WorkType.EXPORT) {
                // ✅ Kiểm tra 1: Sản phẩm phải tồn tại trong đúng kho này mới được xuất
                Inventory inventory = inventoryRepository
                        .findByWarehouseIdAndProductId(request.getWarehouseId(), productId)
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_IN_WAREHOUSE));

                // ✅ Kiểm tra 2: Số lượng xuất không được vượt quá tồn kho
                // → Xử lý bên trong decreaseQuantity(), throw nếu quantity âm
                inventory.decreaseQuantity(quantity);

                Inventory savedInventory = inventoryRepository.save(inventory);
                responses.add(inventoryMapper.toInventoryResponse(savedInventory));

            } else { // IMPORT
                // ✅ Kiểm tra 3: Sản phẩm không được tồn tại ở bất kỳ kho nào khác
                // → Cần thêm method: inventoryRepository.findByProductId(productId)
                inventoryRepository.findByProductId(productId).ifPresent(existing -> {
                    if (!existing.getWarehouse().getId().equals(request.getWarehouseId())) {
                        throw new IllegalArgumentException(
                                "Product " + productId + " already exists in another warehouse: "
                                        + existing.getWarehouse().getId());
                    }
                });

                Inventory inventory = inventoryRepository
                        .findByWarehouseIdAndProductId(request.getWarehouseId(), productId)
                        .orElseGet(() -> {
                            Inventory newInventory = new Inventory();
                            newInventory.setWarehouse(warehouse);
                            newInventory.setProductId(productId);
                            newInventory.setQuantity(BigDecimal.ZERO);
                            return newInventory;
                        });

                // ✅ Kiểm tra 4: Tổng hàng sau nhập không vượt quá capacity của kho
                // → Cần thêm method: inventoryRepository.getTotalQuantityByWarehouse(warehouseId)
                BigDecimal capacity = warehouseConfigService.get(warehouse.getConfigId()).getWarehouseMaxCapacity();
                BigDecimal currentTotal = inventoryRepository
                        .getTotalQuantityByWarehouse(request.getWarehouseId());
                BigDecimal projectedTotal = currentTotal.add(quantity);

                if (projectedTotal.compareTo(capacity) > 0) {
                    throw new IllegalArgumentException(
                            "Import quantity exceeds warehouse capacity. "
                                    + "Current: " + currentTotal
                                    + ", Importing: " + quantity
                                    + ", Capacity: " + capacity);
                }

                inventory.increaseQuantity(quantity);

                Inventory savedInventory = inventoryRepository.save(inventory);
                responses.add(inventoryMapper.toInventoryResponse(savedInventory));
            }
        });

        return responses;
    }
}
