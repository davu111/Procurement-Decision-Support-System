package com.ecotel.product_service.Repository;

import com.ecotel.product_service.model.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, String>, JpaSpecificationExecutor<ProductCategory> {
}
