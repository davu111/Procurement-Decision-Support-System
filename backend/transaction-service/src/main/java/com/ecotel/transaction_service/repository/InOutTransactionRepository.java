package com.ecotel.transaction_service.repository;

import com.ecotel.transaction_service.model.InOutTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InOutTransactionRepository extends JpaRepository<InOutTransaction, String> {
    List<InOutTransaction> findByWarehouseId(String warehouseId);

    List<InOutTransaction> findByVehicleId(String vehicleId);
}
