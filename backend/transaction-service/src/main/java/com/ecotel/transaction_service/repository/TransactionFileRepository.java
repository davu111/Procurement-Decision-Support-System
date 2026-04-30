package com.ecotel.transaction_service.repository;

import com.ecotel.transaction_service.model.TransactionFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransactionFileRepository extends JpaRepository<TransactionFile, Long> {
    Optional<TransactionFile> findByObjectName(String objectName);
}
