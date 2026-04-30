package com.ecotel.inventory_optimization_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsumptionHistoryRequest {

    @NotNull private String productId;

    @NotNull private LocalDate periodStartDate;

    @NotNull private LocalDate periodEndDate;

    @NotNull @DecimalMin("0")
    private BigDecimal actualConsumption;

    private BigDecimal plannedConsumption;

    private BigDecimal actualLeadTimeDays;  // L thực tế (ngày)

    private BigDecimal actualSupplyRate;    // K thực tế

    private String notes;

    public static class BatchUpdateRequest {
    }
}
