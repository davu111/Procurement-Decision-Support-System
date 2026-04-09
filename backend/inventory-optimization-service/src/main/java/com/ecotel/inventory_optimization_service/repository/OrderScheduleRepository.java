package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderScheduleRepository extends JpaRepository<OrderSchedule, Long> {

    List<OrderSchedule> findByProductIdOrderByOrderDateAsc(Long productId);

    List<OrderSchedule> findByInventoryResultIdOrderByOrderSequenceAsc(Long inventoryResultId);

    @Query("SELECT o FROM OrderSchedule o WHERE o.orderDate BETWEEN :from AND :to ORDER BY o.orderDate ASC")
    List<OrderSchedule> findByOrderDateBetween(
            @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT o FROM OrderSchedule o WHERE o.product.id = :productId " +
            "AND o.orderDate BETWEEN :from AND :to ORDER BY o.orderDate ASC")
    List<OrderSchedule> findByProductIdAndOrderDateBetween(
            @Param("productId") Long productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    void deleteByInventoryResultId(Long inventoryResultId);

    /**
     * Lấy các đơn hàng ĐANG ĐƯỢC GIAO của sản phẩm.
     *
     * Định nghĩa "đang giao": đơn đã được đặt (orderDate <= today) nhưng chưa nhận
     * (actualDeliveryDate IS NULL) và ngày giao dự kiến còn trong tương lai
     * (expectedDeliveryDate >= fromDate).
     *
     * Không tính các đơn hàng chưa đặt (orderDate > today) vì hoàn toàn có thể hủy.
     */
    @Query("""
        SELECT o FROM OrderSchedule o
        WHERE o.product.id = :productId
          AND o.actualDeliveryDate IS NULL
          AND o.orderDate < :fromDate
          AND o.expectedDeliveryDate > :fromDate
        ORDER BY o.expectedDeliveryDate ASC
    """)
    List<OrderSchedule> findPendingReceipts(
            @Param("productId") Long productId,
            @Param("fromDate")  LocalDate fromDate);
}