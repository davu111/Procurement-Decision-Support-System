package com.ecotel.product_service.repository;

import com.ecotel.product_service.dto.response.ProductImageResponse;
import com.ecotel.product_service.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    Optional<ProductImage> findByProductId(String productId);

    List<ProductImage> findByProductIdIn(List<String> productIds);
}

