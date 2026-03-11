package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ForecastSuggestionResponse {

    private Long productId;
    private PlanningUnit planningUnit;

    // === Gợi ý từ AI ===
    private BigDecimal suggestedQ;          // Q đề xuất
    private ForecastResult demandForecast;
    private ForecastResult leadTimeForecast;
    private boolean requiresManualInput;    // true nếu chưa đủ dữ liệu lịch sử

    // === Thông tin từ Supplier Service (hiển thị preview) ===
    private String supplierProductId;
    private String supplierName;
    private BigDecimal currentSupplyRateK;      // K đã quy đổi về đơn vị kỳ
    private BigDecimal currentFixedOrderCostA;  // A
    private BigDecimal currentUnitPriceC;       // C
    private Integer currentLeadTimeDays;        // L (ngày gốc)
    // null nếu Supplier Service không phản hồi
}
