package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.model.DetailPlanWarehouseProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailPlanWarehouseProductRepository extends JpaRepository<DetailPlanWarehouseProduct, String> {
    List<DetailPlanWarehouseProduct> findByDetailPlanWarehouseId(String detailPlanWarehouseId);
}
