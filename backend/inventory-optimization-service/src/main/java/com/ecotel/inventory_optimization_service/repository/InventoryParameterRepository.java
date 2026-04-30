package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryParameterRepository extends JpaRepository<InventoryParameter, Long> {

    /**
     * Tìm các kế hoạch có khoảng thời gian TRÙNG với [newStart, newEnd].
     * Điều kiện trùng: existingStart <= newEnd AND existingEnd >= newStart
     */
    @Query("""
                SELECT p FROM InventoryParameter p
                WHERE p.productId = :productId
                  AND p.status IN ('ACTIVE', 'SUPERSEDED')
                  AND p.actualFirstOrderDate < :newStart
                  AND p.actualEndDate   > :newStart
                ORDER BY p.actualFirstOrderDate DESC
                LIMIT 1
            """)
    List<InventoryParameter> findOverlapping(
            @Param("productId") String productId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd);

    /**
     * Tìm các kế hoạch có khoảng thời gian planStartDate nằm trong [newStart, newEnd].
     * Update thanh CANCELLED cho các kế hoạch này (dùng khi tạo mới kế hoạch, không cho phép trùng).
     * Điều kiện trùng: existingStart <= newEnd
     */
    @Modifying
    @Transactional
    @Query("""
                UPDATE InventoryParameter p
                SET p.status = 'CANCELLED'
                WHERE p.productId = :productId
                  AND p.status IN ('ACTIVE', 'SUPERSEDED')
                  AND p.actualFirstOrderDate <= :newEnd
                  AND p.actualFirstOrderDate >= :newStart
                  AND p.actualEndDate   >= :newStart
            """)
    int findOverlappingToCancel(
            @Param("productId") String productId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd);

    /**
     * Fallback: lấy kế hoạch gần nhất của sản phẩm để dùng snapshot K,A,C,L.
     */
    Optional<InventoryParameter> findTopByProductIdOrderByPlanStartDateDesc(String productId);

    /**
     * Tìm kế hoạch ACTIVE gần nhất của sản phẩm để tính tồn kho dự đoán.
     */
    @Query("""
            SELECT p FROM InventoryParameter p
            WHERE p.productId = :productId
            AND p.status IN ('ACTIVE', 'SUPERSEDED')
            ORDER BY p.actualFirstOrderDate DESC
            """)
    List<InventoryParameter> findLatestActive(@Param("productId") String productId);

    /**
     * Đánh dấu SUPERSEDED cho các kế hoạch nằm trong khoảng [start, end].
     * Dùng khi replan: kế hoạch cũ bị thay thế nhưng không xóa.
     */
    @Query("""
            SELECT p FROM InventoryParameter p
            WHERE p.productId = :productId
                      AND p.status IN ('ACTIVE', 'SUPERSEDED')
                      AND p.actualFirstOrderDate IS NOT NULL
                      AND p.actualEndDate IS NOT NULL
                      AND p.actualFirstOrderDate < :startDate
                      AND p.actualEndDate > :startDate
                    ORDER BY p.actualFirstOrderDate DESC
            LIMIT 1
            """)
    List<InventoryParameter> findActiveToSupersede(
            @Param("productId") String productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    //    @Query("""
//        SELECT p FROM InventoryParameter p
//        WHERE p.productId = :productId
//        #AND p.planStartDate <= :endDate
//        AND p.planEndDate   >= :startDate
//        AND p.status = 'ACTIVE'
//        """)
//    List<InventoryParameter> findActiveToSupersede(
//            @Param("productId") String productId,
//            @Param("startDate") LocalDate startDate,
//            @Param("endDate")   LocalDate endDate);
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
                UPDATE InventoryParameter p
                SET p.status = 'SUPERSEDED'
                WHERE p.productId = :productId
              AND p.status = 'ACTIVE'
              AND p.actualFirstOrderDate IS NOT NULL
              AND p.actualEndDate IS NOT NULL
              AND p.actualFirstOrderDate < :startDate
              AND p.actualEndDate > :startDate
            """)
    void supersede(
            @Param("productId") String productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Lấy tất cả kế hoạch của sản phẩm trong khoảng thời gian (dùng cho lịch sử / chart).
     */
    @Query("""
                SELECT p FROM InventoryParameter p
                WHERE p.productId = :productId
                  AND p.planEndDate >= :from
                  AND p.planStartDate <= :to
                ORDER BY p.planStartDate ASC
            """)
    List<InventoryParameter> findByProductIdAndDateRange(
            @Param("productId") String productId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    // Lay kỳ kế hoạch cụ thể cho sản phẩm + đơn vị kỳ gan nhat theo updated_at
    Optional<InventoryParameter> findTopByProductIdOrderByUpdatedAtDesc(
            String productId);

    Optional<InventoryParameter> findByProductIdAndPlanStartDate(
            String productId, LocalDate planStartDate);

    /**
     * Tìm kế hoạch trùng lặp dựa trên THỜI GIAN THỰC TẾ
     * Dùng actual_first_order_date và actual_end_date thay vì plan_start_date/plan_end_date
     */
    @Query("""
            SELECT p FROM InventoryParameter p
            WHERE p.productId = :productId
              AND p.status IN ('ACTIVE', 'SUPERSEDED')
              AND p.actualFirstOrderDate IS NOT NULL
              AND p.actualEndDate IS NOT NULL
              AND p.actualFirstOrderDate <= :newEnd
              AND p.actualEndDate >= :newStart
            ORDER BY p.actualFirstOrderDate DESC
            """)
    List<InventoryParameter> findOverlappingPlans(
            @Param("productId") String productId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd
    );

    Optional<InventoryParameter> findByProductIdIn(List<String> productIds);

    /**
     * Tìm bản ghi InventoryParameter phù hợp nhất với product_id và khoảng thời gian yêu cầu.
     * <p>
     * Điều kiện:
     * - Đúng product
     * - plan_start_date <= requestStart AND plan_end_date >= requestEnd  (bao hết khoảng yêu cầu)
     * - Ưu tiên status = 'ACTIVE' trước, sau đó updated_at mới nhất
     *
     * @param productId    ID của sản phẩm
     * @param requestStart ngày bắt đầu kỳ yêu cầu
     * @param requestEnd   ngày kết thúc kỳ yêu cầu
     * @return Optional chứa bản ghi phù hợp nhất, hoặc empty nếu không tìm thấy
     */
    @Query("""
            SELECT ip
            FROM InventoryParameter ip
            WHERE ip.productId = :productId
              AND YEAR(ip.planStartDate) * 100 + MONTH(ip.planStartDate) <= :yearMonth
              AND YEAR(ip.planEndDate)   * 100 + MONTH(ip.planEndDate)   >= :yearMonth
            ORDER BY
              CASE WHEN ip.status = 'ACTIVE' THEN 0 ELSE 1 END ASC,
              ip.updatedAt DESC
            LIMIT 1
            """)
    Optional<InventoryParameter> findBestMatchByMonth(
            @Param("productId") String productId,
            @Param("yearMonth") int yearMonth   // format: 202604
    );

    /**
     * Fallback: nếu chưa có actual dates, dùng plan dates
     */
    @Query("""
            SELECT p FROM InventoryParameter p
            WHERE p.productId = :productId
              AND p.status IN ('ACTIVE', 'SUPERSEDED')
              AND (
                (p.actualFirstOrderDate IS NOT NULL AND p.actualEndDate IS NOT NULL
                 AND p.actualFirstOrderDate <= :newEnd AND p.actualEndDate >= :newStart)
                OR
                (p.actualFirstOrderDate IS NULL 
                 AND p.planStartDate <= :newEnd AND p.planEndDate >= :newStart)
              )
            ORDER BY COALESCE(p.actualFirstOrderDate, p.planStartDate) DESC
            """)
    List<InventoryParameter> findOverlappingHybrid(
            @Param("productId") String productId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd
    );
    /**
     * Tìm tất cả parameters của product theo status
     */
    @Query("""
        SELECT ip FROM InventoryParameter ip
        WHERE ip.productId = :productId
        AND ip.status IN :statuses
        ORDER BY ip.planStartDate DESC
        """)
    List<InventoryParameter> findByProductIdAndStatus(
            @Param("productId") String productId,
            @Param("statuses") List<String> statuses
    );
    /**
     * Tìm các InventoryParameter không bị ghì đè (top-level)
     * Tức là id của nó không xuất hiện trong param_receipt của bất kỳ parameter nào khác
     */
    @Query("""
        SELECT ip FROM InventoryParameter ip
        WHERE ip.productId = :productId
          AND ip.status IN ('ACTIVE', 'SUPERSEDED')
          AND NOT EXISTS (
            SELECT 1 FROM InventoryParameter ip2
            WHERE ip2.paramReceipt = ip.id
          )
        ORDER BY 
          CASE WHEN ip.actualFirstOrderDate IS NOT NULL 
               THEN ip.actualFirstOrderDate 
               ELSE ip.planStartDate 
          END DESC
        """)
    List<InventoryParameter> findTopLevelParametersByProduct(@Param("productId") String productId);

    /**
     * Kiểm tra xem có InventoryParameter nào ghì đè lên parameter này không
     */
    @Query("""
        SELECT CASE WHEN COUNT(ip) > 0 THEN true ELSE false END
        FROM InventoryParameter ip
        WHERE ip.paramReceipt = :parameterId
        """)
    boolean existsByParamReceipt(@Param("parameterId") Long parameterId);

    /**
     * Tìm InventoryParameter ghì đè lên parameter hiện tại
     */
    @Query("""
        SELECT ip FROM InventoryParameter ip
        WHERE ip.paramReceipt = :parameterId
        ORDER BY ip.planStartDate DESC
        LIMIT 1
        """)
    Optional<InventoryParameter> findByParamReceipt(@Param("parameterId") Long parameterId);
}
