package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.Product;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

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
    private PlanningUnit planningUnit;
    private LocalDate periodStartDate; // ngày đầu kỳ
    private LocalDate periodEndDate; // ngày cuối kỳ
    private BigDecimal actualConsumption; // Q thực tế trong kỳ
    private BigDecimal plannedConsumption; // Q kế hoạch (để tính sai số)
    private BigDecimal actualLeadTimeDays; // L thực tế (ngày) - tính từ ngày đặt đến ngày nhận
    private BigDecimal actualSupplyRate; // K thực tế trong kỳ
    private String notes;
    private LocalDateTime createdAt;
}
