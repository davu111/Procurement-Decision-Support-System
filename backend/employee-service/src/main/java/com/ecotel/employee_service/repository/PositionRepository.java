package com.ecotel.employee_service.repository;

import com.ecotel.employee_service.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PositionRepository extends JpaRepository<Position, String> {
}
