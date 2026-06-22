package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.StockCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockCountRepository extends JpaRepository<StockCount, Long> {

    /** Lịch sử kiểm kê của một sản phẩm, mới nhất trước */
    List<StockCount> findByProductIdOrderByCountDateDesc(String productId);

    /** Phiếu CONFIRMED gần nhất TRƯỚC một ngày cụ thể — dùng làm initialInventory */
    @Query("""
        SELECT s FROM StockCount s
        WHERE s.productId = :productId
          AND s.status = 'CONFIRMED'
          AND s.countDate < :date
        ORDER BY s.countDate DESC
    """)
    List<StockCount> findConfirmedBeforeDate(
            @Param("productId") String productId,
            @Param("date") LocalDate date
    );

    /** Kiểm tra trùng ngày kiểm kê */
    boolean existsByProductIdAndCountDate(String productId, LocalDate countDate);

    /** Lấy phiếu CONFIRMED trong khoảng ngày — dùng cho Loss Rate Analytics */
    @Query("""
        SELECT s FROM StockCount s
        WHERE s.productId = :productId
          AND s.status = 'CONFIRMED'
          AND s.countDate BETWEEN :from AND :to
        ORDER BY s.countDate ASC
    """)
    List<StockCount> findConfirmedInRange(
            @Param("productId") String productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
}
