package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.enums.PlanStatus;
import com.ecotel.plan_service.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, String> {
    List<Plan> findAllByOrderByStartDateAsc();

    List<Plan> findByPlanStatus(PlanStatus status);

    @Query("SELECT p FROM Plan p\n" +
            "    WHERE :now BETWEEN p.startDate AND p.endDate")
    List<Plan> findPlansByDateRange(LocalDateTime now);
}
