package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsumptionHistoryRepository extends JpaRepository<ConsumptionHistory, Long> {

    List<ConsumptionHistory> findByProductIdAndPlanningUnitOrderByPeriodStartDateAsc(
            Long productId, PlanningUnit planningUnit);

    @Query("SELECT COUNT(c) FROM ConsumptionHistory c WHERE c.product.id = :productId AND c.planningUnit = :unit")
    int countByProductIdAndPlanningUnit(@Param("productId") Long productId, @Param("unit") PlanningUnit unit);

    @Query("SELECT c FROM ConsumptionHistory c WHERE c.product.id = :productId AND c.planningUnit = :unit " +
            "ORDER BY c.periodStartDate DESC")
    List<ConsumptionHistory> findRecentByProductIdAndPlanningUnit(
            @Param("productId") Long productId, @Param("unit") PlanningUnit unit);
}
