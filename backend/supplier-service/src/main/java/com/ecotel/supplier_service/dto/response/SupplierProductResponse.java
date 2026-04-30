package com.ecotel.supplier_service.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupplierProductResponse {
    private String id;
    private String supplierId;
    private String supplierCode;
    private String supplierName;
    private String productId;
    private String productName;
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
