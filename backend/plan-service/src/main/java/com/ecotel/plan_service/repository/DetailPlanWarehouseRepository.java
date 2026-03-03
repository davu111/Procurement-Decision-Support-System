package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.model.DetailPlanWarehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailPlanWarehouseRepository extends JpaRepository<DetailPlanWarehouse, String> {
    List<DetailPlanWarehouse> findByDetailPlanId(String detailPlanId);
}
