package com.ecotel.vehicle_service.repository;

import com.ecotel.vehicle_service.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
}
