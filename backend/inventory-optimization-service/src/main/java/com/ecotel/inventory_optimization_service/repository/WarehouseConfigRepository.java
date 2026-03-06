package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarehouseConfigRepository extends JpaRepository<WarehouseConfig, Long> {
    Optional<WarehouseConfig> findByIsDefaultTrue();
}
