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

    // Lay kỳ kế hoạch cụ thể cho sản phẩm + đơn vị kỳ gan nhat theo updated_at
    Optional<InventoryParameter> findTopByProductIdAndPlanningUnitOrderByUpdatedAtDesc(
            Long productId, PlanningUnit planningUnit);

    Optional<InventoryParameter> findByProductIdAndPlanStartDateAndPlanningUnit(
            Long productId, LocalDate planStartDate, PlanningUnit planningUnit);

    Optional<InventoryParameter> findByProductIdAndPlanStartDateBetweenAndPlanningUnit(
            Long productId,
            LocalDate startDate,
            LocalDate endDate,
            PlanningUnit unit);

    List<InventoryParameter> findByProductIdOrderByPlanStartDateDesc(Long productId);
    /**
     * Fallback: lấy kỳ kế hoạch gần nhất của cùng sản phẩm + đơn vị kỳ
     * Dùng khi Supplier Service không phản hồi
     */
    Optional<InventoryParameter> findTopByProductIdAndPlanningUnitOrderByPlanStartDateDesc(
            Long productId, PlanningUnit planningUnit);

    Optional<InventoryParameter> findByProductIdIn(List<Long> productIds);
}
