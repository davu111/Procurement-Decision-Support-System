package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.model.DetailPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailPlanRepository extends JpaRepository<DetailPlan, String> {
    List<DetailPlan> findByVehiclePlanId(String vehiclePlanId);
}
