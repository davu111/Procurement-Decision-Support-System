package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.enums.AreaCode;
import com.ecotel.plan_service.model.VehiclePlanArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiclePlanAreaRepository extends JpaRepository<VehiclePlanArea, Integer> {
    List<VehiclePlanArea> findByVehiclePlanId(String vehiclePlanId);
}
