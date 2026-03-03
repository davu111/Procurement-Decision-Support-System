package com.ecotel.warehouse_service.repository;

import com.ecotel.warehouse_service.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String>, JpaSpecificationExecutor<Inventory> {
    List<Inventory> findByWarehouseId(String warehouseId);
    Optional<Inventory> findByWarehouseIdAndProductId(String warehouseId, String productId);
}
