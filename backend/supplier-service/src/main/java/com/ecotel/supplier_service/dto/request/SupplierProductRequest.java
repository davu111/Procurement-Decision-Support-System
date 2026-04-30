package com.ecotel.supplier_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierProductRequest {

    @NotNull(message = "product_id không được trống")
    private String productId;

    @NotNull(message = "Năng lực cung cấp K không được trống")
    @DecimalMin(value = "0.0001", message = "K phải > 0")
    private BigDecimal maxSupplyPerMonth;

    @NotNull(message = "Chi phí đặt hàng A không được trống")
    @DecimalMin(value = "0.0001", message = "A phải > 0")
    private BigDecimal fixedOrderCost;

    @NotNull(message = "Đơn giá C không được trống")
    @DecimalMin(value = "0.0001", message = "C phải > 0")
    private BigDecimal unitPrice;

    @NotNull(message = "Lead time không được trống")
    @Min(value = 1, message = "Lead time phải >= 1 ngày")
    private Integer committedLeadTimeDays;

    @NotNull(message = "Ngày hiệu lực không được trống")
    private LocalDate effectiveDate;

    private String notes;
}
