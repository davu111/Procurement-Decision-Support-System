package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsumptionHistoryResponse {
    private Long id;
    private Long productId;
    private String productName;
    private LocalDate periodStartDate; // ngày đầu kỳ
    private LocalDate periodEndDate; // ngày cuối kỳ
    private BigDecimal actualConsumption; // Q thực tế trong kỳ
    private BigDecimal plannedConsumption; // Q kế hoạch (để tính sai số)
    private BigDecimal actualLeadTimeDays; // L thực tế (ngày) - tính từ ngày đặt đến ngày nhận
    private BigDecimal actualSupplyRate; // K thực tế trong kỳ
    private String notes;
    private LocalDateTime createdAt;
}
