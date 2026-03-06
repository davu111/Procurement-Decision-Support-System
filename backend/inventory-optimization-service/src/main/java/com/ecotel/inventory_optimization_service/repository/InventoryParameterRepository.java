package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryParameterRepository extends JpaRepository<InventoryParameter, Long> {

    List<InventoryParameter> findByProductId(Long productId);

    Optional<InventoryParameter> findByProductIdAndPlanStartDateAndPlanningUnit(
            Long productId, LocalDate planStartDate, PlanningUnit planningUnit);

    @Query("SELECT p FROM InventoryParameter p WHERE p.planStartDate = :startDate AND p.planningUnit = :unit")
    List<InventoryParameter> findByPlanStartDateAndPlanningUnit(
            @Param("startDate") LocalDate startDate,
            @Param("unit") PlanningUnit unit);

    List<InventoryParameter> findByProductIdOrderByPlanStartDateDesc(Long productId);
}
