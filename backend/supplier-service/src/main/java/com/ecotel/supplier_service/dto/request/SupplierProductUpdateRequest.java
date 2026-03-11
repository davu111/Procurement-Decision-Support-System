package com.ecotel.supplier_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupplierProductUpdateRequest {
    private String id;
    private String supplierId;
    private String supplierCode;
    private String supplierName;
    private Long productId;
    private BigDecimal maxSupplyPerMonth;
    private BigDecimal fixedOrderCost;
    private BigDecimal unitPrice;
    private Integer committedLeadTimeDays;
    private LocalDate effectiveDate;
    private Boolean isActive;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
