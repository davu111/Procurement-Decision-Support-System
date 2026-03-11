package com.ecotel.supplier_service.repository;

import com.ecotel.supplier_service.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    boolean existsBySupplierCode(String code);
    Optional<Supplier> findBySupplierCode(String code);
    List<Supplier> findByIsActiveTrue();
}
