package com.ecotel.vehicle_service.repository;

import com.ecotel.vehicle_service.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleTypeRepository extends JpaRepository<VehicleType, String> {
}
