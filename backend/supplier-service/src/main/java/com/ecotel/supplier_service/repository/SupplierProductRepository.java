package com.ecotel.supplier_service.repository;

import com.ecotel.supplier_service.model.SupplierProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierProductRepository extends JpaRepository<SupplierProduct, UUID> {

    // Tìm theo nhà cung cấp
    List<SupplierProduct> findBySupplierId(UUID supplierId);
    List<SupplierProduct> findBySupplierIdAndIsActiveTrue(UUID supplierId);

    // Inventory Service gọi endpoint này để lấy K, A, C, L theo productId
    Optional<SupplierProduct> findByProductIdAndIsActiveTrue(String productId);

    // Kiểm tra trùng lặp supplier + product
    boolean existsBySupplierIdAndProductId(UUID supplierId, String productId);

    // Tìm tất cả sản phẩm đang active
    List<SupplierProduct> findByIsActiveTrue();

    @Query("SELECT sp FROM SupplierProduct sp WHERE sp.productId = :productId AND sp.isActive = true")
    Optional<SupplierProduct> findActiveByProductId(@Param("productId") String productId);
}
