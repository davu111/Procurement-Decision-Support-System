package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.model.Product;
import com.ecotel.inventory_optimization_service.model.WarehouseConfig;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InventoryParameterResponse {
    Long id;
    Long productId;
    Long warehouseConfigId;
    UUID supplierProductId;
    LocalDate planStartDate;
    LocalDate planEndDate;
    LocalDate scheduleStartDate;
    BigDecimal demandQ;
    BigDecimal storageCostCoefficientI;
    BigDecimal snapshotSupplyRateK;         // K
    BigDecimal snapshotFixedOrderCostA;     // A
    BigDecimal snapshotUnitPriceC;          // C
    BigDecimal snapshotLeadTimeL;           // L
    String supplierDataSource;
    String status = "ACTIVE";
    BigDecimal initialInventory;
    BigDecimal scheduledReceiptQty;
    LocalDate scheduledReceiptDate;
    Boolean qIsSuggested = false;
    String suggestionModel;
    BigDecimal suggestionMape;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
