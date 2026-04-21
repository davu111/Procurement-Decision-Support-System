package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParameterChainDto {
    private Long id;
    private LocalDate planStartDate;
    private LocalDate planEndDate;
    private LocalDate actualFirstOrderDate;
    private LocalDate actualEndDate;
    private Long paramReceipt;
    private String status;
}
