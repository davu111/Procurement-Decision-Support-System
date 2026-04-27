package com.ecotel.transaction_service.repository;

import com.ecotel.transaction_service.model.InOutTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InOutTransactionRepository extends JpaRepository<InOutTransaction, String> {
    @Query("""
    SELECT t FROM InOutTransaction t
    WHERE t.warehouseId = :warehouseId
      AND (:startDate IS NULL OR t.createdAt >= :startDate)
      AND (:endDate IS NULL OR t.createdAt <= :endDate)
""")
    Page<InOutTransaction> findByWarehouseIdWithFilter(
            @Param("warehouseId") String warehouseId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("""
    SELECT t FROM InOutTransaction t
    WHERE (:startDate IS NULL OR t.createdAt >= :startDate)
      AND (:endDate IS NULL OR t.createdAt <= :endDate)
""")
    Page<InOutTransaction> findAllWithFilter(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
