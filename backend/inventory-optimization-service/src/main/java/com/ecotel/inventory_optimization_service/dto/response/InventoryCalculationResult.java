package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import java.math.BigDecimal;

/**
 * Kết quả tính toán thuật toán mô hình bổ sung dần
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryCalculationResult {
    private Long id;

    // === Kết quả tối ưu ===
    private BigDecimal optimalOrderQtyS;       // S*
    private BigDecimal optimalOrderCountN;     // n*
    private BigDecimal optimalCycleTimeTau;    // τ*
    private BigDecimal maxInventoryLevel;      // S*(1-Q/K)
    private BigDecimal avgInventoryLevel;      // Z
    private BigDecimal reorderPointB;          // B
    private BigDecimal minTotalCost;           // D_min
    private BigDecimal totalCostWithPurchase;  // D_min + C*Q
    private BigDecimal replenishmentTimeTn;    // Tn
    private Integer mValue;                    // m = floor(L/τ*)

    // === Tham số đầu vào (để trả về cho client kiểm tra) ===
    private Long InventoryParameterId;
    private BigDecimal demandQ;
    private BigDecimal supplyRateK;
    private BigDecimal fixedOrderCostA;
    private BigDecimal unitPriceC;
    private BigDecimal storageCoefficientI;
    private BigDecimal leadTimeL;
    private BigDecimal kMinusQFactor;          // (1 - Q/K)
}
