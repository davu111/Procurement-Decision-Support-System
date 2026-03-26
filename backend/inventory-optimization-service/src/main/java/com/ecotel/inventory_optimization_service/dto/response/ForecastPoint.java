package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastPoint {
    private String period;        // YYYY-MM
    private double forecastValue;
    private double upperBound;    // forecastValue * (1 + mape/100)
    private double lowerBound;    // forecastValue * (1 - mape/100)
}
