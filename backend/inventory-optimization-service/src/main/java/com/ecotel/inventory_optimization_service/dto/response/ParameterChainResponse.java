package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParameterChainResponse {
    private String productId;
    private Integer chainLength;
    private List<ParameterChainDto> parameters;
}
