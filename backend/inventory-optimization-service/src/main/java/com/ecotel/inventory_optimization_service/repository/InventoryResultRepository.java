package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.InventoryResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryResultRepository extends JpaRepository<InventoryResult, Long> {
    Optional<InventoryResult> findByInventoryParameterId(Long parameterId);
}
