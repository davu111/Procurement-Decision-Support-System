package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByCode(String code);
    List<Product> findByIsActiveTrue();
    boolean existsByCode(String code);
}
