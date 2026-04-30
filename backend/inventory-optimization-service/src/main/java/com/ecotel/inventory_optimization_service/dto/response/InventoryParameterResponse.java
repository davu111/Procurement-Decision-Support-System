package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

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
    String productId;
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
