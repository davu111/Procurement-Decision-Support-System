package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderScheduleDto {
    private Long id;
    private Long parameterId;
    private Long inventoryResultId;
    private String productId;
    private Integer orderSequence;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private BigDecimal orderQuantity;
    private BigDecimal estimatedCost;
}
