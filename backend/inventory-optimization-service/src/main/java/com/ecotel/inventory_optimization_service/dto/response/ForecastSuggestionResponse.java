package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ForecastSuggestionResponse {
    private Long productId;
    private PlanningUnit planningUnit;
    private BigDecimal suggestedQ;          // Q đề xuất
    private BigDecimal suggestedL;          // L đề xuất
    private ForecastResult demandForecast;
    private ForecastResult leadTimeForecast;
    private boolean requiresManualInput;    // true nếu chưa đủ data
}
