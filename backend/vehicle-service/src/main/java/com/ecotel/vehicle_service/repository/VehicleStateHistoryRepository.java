package com.ecotel.vehicle_service.repository;

import com.ecotel.vehicle_service.model.VehicleStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleStateHistoryRepository extends JpaRepository<VehicleStateHistory, String> {
}
