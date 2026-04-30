package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsumptionHistoryRepository extends JpaRepository<ConsumptionHistory, Long> {

    /**
     * Lấy toàn bộ lịch sử tiêu thụ của sản phẩm, sắp xếp tăng dần.
     * Forecast model dùng hàm này — không cần planningUnit nữa.
     */
    List<ConsumptionHistory> findByProductIdOrderByPeriodStartDateAsc(String productId);

    /**
     * Đếm số kỳ lịch sử — dùng để chọn mô hình (WMA / HW / SR).
     */
    int countByProductId(String productId);

    /**
     * Lấy lịch sử trong khoảng thời gian (dùng cho chart / báo cáo).
     */
    @Query("""
        SELECT c FROM ConsumptionHistory c
        WHERE c.productId = :productId
          AND c.periodStartDate >= :from
          AND c.periodStartDate <= :to
        ORDER BY c.periodStartDate ASC
    """)
    List<ConsumptionHistory> findByProductIdAndDateRange(
            @Param("productId") String productId,
            @Param("from") LocalDate from,
            @Param("to")        LocalDate to);

    List<ConsumptionHistory> findByProductIdAndPeriodStartDateBetweenOrderByPeriodStartDateAsc(
            String productId,
            LocalDate start,
            LocalDate end
    );
}