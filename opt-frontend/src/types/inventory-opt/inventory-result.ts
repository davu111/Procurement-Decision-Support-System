export interface InventoryResult {
    // === Kết quả tối ưu ===
    optimalOrderQtyS: number;       // S*
    optimalOrderCountN: number;     // n*
    optimalCycleTimeTau: number;    // τ*
    maxInventoryLevel: number;      // S*(1-Q/K)
    avgInventoryLevel: number;      // Z
    reorderPointB: number;          // B
    minTotalCost: number;           // D_min
    totalCostWithPurchase: number;  // D_min + C*Q
    replenishmentTimeTn: number;    // Tn
    mValue: number;                    // m = floor(L/τ*)

    // === Tham số đầu vào (để trả về cho client kiểm tra) ===
    demandQ: number;
    supplyRateK: number;
    fixedOrderCostA: number;
    unitPriceC: number;
    storageCoefficientI: number;
    leadTimeL: number;
    kMinusQFactor: number;          // (1 - Q/K)
}