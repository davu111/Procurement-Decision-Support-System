package com.ecotel.warehouse_service.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WarehouseConfigRequest {
    @NotNull @DecimalMin("0")
    private BigDecimal interestRate;        // lãi suất/năm, ví dụ: 0.08

    @NotNull @DecimalMin("0")
    private BigDecimal warehouseMonthlyCost; // chi phí kho/tháng

    @NotNull @DecimalMin("0.0001")
    private BigDecimal warehouseMaxCapacity; // sức chứa tối đa

    @NotNull @DecimalMin("0")
    private BigDecimal spoilageRate;         // tỉ lệ hao hụt/năm, ví dụ: 0.02

    @NotNull @DecimalMin("0")
    private BigDecimal insuranceRate;        // bảo hiểm/năm, ví dụ: 0.005
}
