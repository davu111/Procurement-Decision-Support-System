package com.ecotel.inventory_optimization_service.dto.request.supplier;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dữ liệu nhận từ Supplier Service.
 * Mirror của SupplierProductResponse bên supplier-service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierProductData {
    private String id;
    private String supplierId;
    private String supplierCode;
    private String supplierName;
    private String productId;
    private BigDecimal maxSupplyPerMonth;       // K/tháng
    private BigDecimal fixedOrderCost;          // A
    private BigDecimal unitPrice;               // C
    private Integer committedLeadTimeDays;      // L (ngày)
    private LocalDate effectiveDate;
    private Boolean isActive;
    private String notes;
}
