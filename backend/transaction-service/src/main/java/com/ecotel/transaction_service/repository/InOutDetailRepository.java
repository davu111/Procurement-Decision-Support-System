package com.ecotel.transaction_service.repository;

import com.ecotel.transaction_service.model.InOutDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InOutDetailRepository extends JpaRepository<InOutDetail, String> {
}
