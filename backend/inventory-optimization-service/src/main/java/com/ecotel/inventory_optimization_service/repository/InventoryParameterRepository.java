package com.ecotel.inventory_optimization_service.repository;

import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
        WHERE p.product.id = :productId
          AND p.status = 'ACTIVE'
          AND p.planStartDate <= :newEnd
          AND p.planEndDate   >= :newStart
    """)
    List<InventoryParameter> findOverlapping(
            @Param("productId") Long productId,
            @Param("newStart")  LocalDate newStart,
            @Param("newEnd")    LocalDate newEnd);

    /**
     * Fallback: lấy kế hoạch gần nhất của sản phẩm để dùng snapshot K,A,C,L.
     */
    Optional<InventoryParameter> findTopByProductIdOrderByPlanStartDateDesc(Long productId);

/**
 * Tìm kế hoạch ACTIVE gần nhất của sản phẩm để tính tồn kho dự đoán.
 */
    @Query("""
    SELECT p FROM InventoryParameter p
    WHERE p.product.id = :productId
    AND p.status = 'ACTIVE'
    ORDER BY p.planStartDate DESC
    """)
    List<InventoryParameter> findLatestActive(@Param("productId") Long productId);

    /**
     * Đánh dấu SUPERSEDED cho các kế hoạch nằm trong khoảng [start, end].
     * Dùng khi replan: kế hoạch cũ bị thay thế nhưng không xóa.
     */
    @Query("""
        SELECT p FROM InventoryParameter p
        WHERE p.product.id = :productId
        AND p.planEndDate   >= :startDate
        AND p.status = 'ACTIVE'
        """)
    List<InventoryParameter> findActiveToSupersede(
            @Param("productId") Long productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate")   LocalDate endDate);

//    @Query("""
//        SELECT p FROM InventoryParameter p
//        WHERE p.product.id = :productId
//        #AND p.planStartDate <= :endDate
//        AND p.planEndDate   >= :startDate
//        AND p.status = 'ACTIVE'
//        """)
//    List<InventoryParameter> findActiveToSupersede(
//            @Param("productId") Long productId,
//            @Param("startDate") LocalDate startDate,
//            @Param("endDate")   LocalDate endDate);
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
    UPDATE InventoryParameter p
    SET p.status = 'SUPERSEDED'
    WHERE p.product.id = :productId
    AND p.planStartDate <= :endDate
    AND p.planEndDate   >= :startDate
    AND p.status = 'ACTIVE'
            """)
    void supersede(
            @Param("productId")  Long productId,
            @Param("startDate")  LocalDate startDate,
            @Param("endDate")    LocalDate endDate);

    /**
     * Lấy tất cả kế hoạch của sản phẩm trong khoảng thời gian (dùng cho lịch sử / chart).
     */
    @Query("""
        SELECT p FROM InventoryParameter p
        WHERE p.product.id = :productId
          AND p.planEndDate >= :from
          AND p.planStartDate <= :to
        ORDER BY p.planStartDate ASC
    """)
    List<InventoryParameter> findByProductIdAndDateRange(
            @Param("productId") Long productId,
            @Param("from")      LocalDate from,
            @Param("to")        LocalDate to);

    // Lay kỳ kế hoạch cụ thể cho sản phẩm + đơn vị kỳ gan nhat theo updated_at
    Optional<InventoryParameter> findTopByProductIdOrderByUpdatedAtDesc(
            Long productId);

    Optional<InventoryParameter> findByProductIdAndPlanStartDate(
            Long productId, LocalDate planStartDate);

    @Query("""
    SELECT ip FROM InventoryParameter ip
    WHERE ip.product.id = :productId
      AND ip.planStartDate <= :endDate
      AND ip.planEndDate >= :startDate
""")
    List<InventoryParameter> findOverlappingPlans(
            @Param("productId") Long productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    Optional<InventoryParameter> findByProductIdIn(List<Long> productIds);

    /**
     * Tìm bản ghi InventoryParameter phù hợp nhất với product_id và khoảng thời gian yêu cầu.
     *
     * Điều kiện:
     *  - Đúng product
     *  - plan_start_date <= requestStart AND plan_end_date >= requestEnd  (bao hết khoảng yêu cầu)
     *  - Ưu tiên status = 'ACTIVE' trước, sau đó updated_at mới nhất
     *
     * @param productId   ID của sản phẩm
     * @param requestStart ngày bắt đầu kỳ yêu cầu
     * @param requestEnd   ngày kết thúc kỳ yêu cầu
     * @return Optional chứa bản ghi phù hợp nhất, hoặc empty nếu không tìm thấy
     */
    @Query("""
        SELECT ip
        FROM InventoryParameter ip
        WHERE ip.product.id = :productId
          AND YEAR(ip.planStartDate) * 100 + MONTH(ip.planStartDate) <= :yearMonth
          AND YEAR(ip.planEndDate)   * 100 + MONTH(ip.planEndDate)   >= :yearMonth
        ORDER BY
          CASE WHEN ip.status = 'ACTIVE' THEN 0 ELSE 1 END ASC,
          ip.updatedAt DESC
        LIMIT 1
        """)
    Optional<InventoryParameter> findBestMatchByMonth(
            @Param("productId") Long productId,
            @Param("yearMonth") int  yearMonth   // format: 202604
    );
}
