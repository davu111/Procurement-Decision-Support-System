package com.ecotel.warehouse_service.repository;

import com.ecotel.warehouse_service.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
    Optional<Warehouse> findByConfigId(Long configId);
}
