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
     * Lấy lịch đặt hàng HIỆU LỰC của sản phẩm trong khoảng thời gian.
     *
     * Logic "hiệu lực":
     *   Một order_schedule còn hiệu lực nếu orderDate của nó NẰM TRONG khoảng
     *   [planStartDate, planEndDate] của inventory_parameter sinh ra nó (qua inventory_result)
     *   VÀ khoảng đó KHÔNG BỊ COVER bởi bất kỳ kế hoạch ACTIVE nào khác.
     *
     * Cụ thể: lấy tất cả schedules trong [from, to], loại bỏ những schedule có orderDate
     * nằm trong khoảng thời gian của một kế hoạch ACTIVE KHÁC (tức là bị ghì đè).
     *
     * Ví dụ:
     *   Kế hoạch A (SUPERSEDED): 1/4–30/11
     *   Kế hoạch B (ACTIVE):     1/7–31/10
     *   → Schedules của A có orderDate trong [1/4–30/6]  → còn hiệu lực (không bị B cover)
     *   → Schedules của A có orderDate trong [1/7–31/10] → bị loại (bị B cover)
     *   → Schedules của A có orderDate trong [1/11–30/11]→ bị loại (nằm sau B nhưng
     *       logic kế hoạch A đã lỗi thời — xem note bên dưới)
     *   → Schedules của B có orderDate trong [1/7–31/10] → còn hiệu lực
     *
     * Note về phần sau kế hoạch ACTIVE (1/11–30/11 trong ví dụ):
     *   Phần này của kế hoạch A không bị cover bởi B nhưng đã lỗi thời vì
     *   tồn kho cuối tháng 10 (sau kế hoạch B) không còn khớp với giả định của A.
     *   → Loại bỏ bằng cách chỉ giữ schedules của kế hoạch SUPERSEDED khi orderDate
     *     nằm TRƯỚC planStartDate của kế hoạch ACTIVE cover nó.
     */
    @Query("""
        SELECT o FROM OrderSchedule o
        JOIN o.inventoryResult ir
        JOIN ir.inventoryParameter ip
        WHERE o.product.id = :productId
          AND o.orderDate BETWEEN :from AND :to
          AND NOT EXISTS (
              SELECT 1 FROM InventoryParameter active
              WHERE active.product.id = :productId
                AND active.status = 'ACTIVE'
                AND active.id <> ip.id
                AND o.orderDate BETWEEN active.planStartDate AND active.planEndDate
          )
          AND (
              ip.status = 'ACTIVE'
              OR (
                  ip.status = 'SUPERSEDED'
                  AND NOT EXISTS (
                      SELECT 1 FROM InventoryParameter laterActive
                      WHERE laterActive.product.id = :productId
                        AND laterActive.status = 'ACTIVE'
                        AND laterActive.planStartDate <= ip.planEndDate
                        AND o.orderDate >= laterActive.planStartDate
                  )
              )
          )
        ORDER BY o.orderDate ASC
    """)
    List<OrderSchedule> findEffectiveByProductIdAndDateRange(
            @Param("productId") Long productId,
            @Param("from")      LocalDate from,
            @Param("to")        LocalDate to);

    /**
     * Overload không lọc sản phẩm — lấy tất cả sản phẩm trong khoảng ngày.
     */
    @Query("""
        SELECT o FROM OrderSchedule o
        JOIN o.inventoryResult ir
        JOIN ir.inventoryParameter ip
        WHERE o.orderDate BETWEEN :from AND :to
          AND NOT EXISTS (
              SELECT 1 FROM InventoryParameter active
              WHERE active.product.id = o.product.id
                AND active.status = 'ACTIVE'
                AND active.id <> ip.id
                AND o.orderDate BETWEEN active.planStartDate AND active.planEndDate
          )
          AND (
              ip.status = 'ACTIVE'
              OR (
                  ip.status = 'SUPERSEDED'
                  AND NOT EXISTS (
                      SELECT 1 FROM InventoryParameter laterActive
                      WHERE laterActive.product.id = o.product.id
                        AND laterActive.status = 'ACTIVE'
                        AND laterActive.planStartDate <= ip.planEndDate
                        AND o.orderDate >= laterActive.planStartDate
                  )
              )
          )
        ORDER BY o.orderDate ASC
    """)
    List<OrderSchedule> findEffectiveByDateRange(
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to);

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