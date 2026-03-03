package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.model.VehiclePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiclePlanRepository extends JpaRepository<VehiclePlan, String> {
    List<VehiclePlan> findByPlanId(String planId);
}
