package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Core Service - Implement thuật toán mô hình dự trữ bổ sung dần
 *
 * Công thức:
 *   S* = sqrt(2AQ/IC × K/(K-Q))
 *   n* = Q/S*
 *   τ* = 1/n*  (theo đơn vị kỳ kế hoạch)
 *   Z  = S*(1 - Q/K)/2
 *   B  = Q*L - m*S*  với m = floor(L/τ*)
 *   D_min = 2*A*n*
 */
@Service
public class InventoryCalculationService {

    private static final MathContext MC = new MathContext(15, RoundingMode.HALF_UP);
    private static final int SCALE = 4;

    /**
     * Tính toán tối ưu theo mô hình bổ sung dần (Gradual Replenishment Model)
     */
    public InventoryCalculationResult calculate(InventoryParameter param) {
        BigDecimal Q = param.getDemandQ();                  // nhu cầu trong kỳ
        BigDecimal K = param.getSnapshotSupplyRateK();      // K snapshot từ supplier
        BigDecimal A = param.getSnapshotFixedOrderCostA();  // A snapshot từ supplier
        BigDecimal C = param.getSnapshotUnitPriceC();       // C snapshot từ supplier
        BigDecimal I = param.getStorageCostCoefficientI();  // hệ số bảo quản (đã quy đổi về kỳ)
        BigDecimal L = param.getSnapshotLeadTimeL();        // L snapshot từ supplier

        validate(Q, K, A, C, I, L);

        // === Tính S* = sqrt(2AQ/IC × K/(K-Q)) ===
        BigDecimal numerator = BigDecimal.valueOf(2).multiply(A).multiply(Q, MC);
        BigDecimal denominator = I.multiply(C, MC);
        BigDecimal kMinusQ = K.subtract(Q);
        BigDecimal kFactor = K.divide(kMinusQ, MC); // K/(K-Q)

        BigDecimal sSquared = numerator.divide(denominator, MC).multiply(kFactor, MC);
        BigDecimal optimalS = sqrt(sSquared).setScale(SCALE, RoundingMode.HALF_UP);

        // === Tính n* = Q/S* ===
        BigDecimal optimalN = Q.divide(optimalS, MC).setScale(SCALE, RoundingMode.HALF_UP);

        // === Tính τ* = 1/n* (kỳ) ===
        BigDecimal optimalTau = BigDecimal.ONE.divide(optimalN, MC).setScale(6, RoundingMode.HALF_UP);

        // === Tính lượng dự trữ tối đa S*(1-Q/K) ===
        BigDecimal qOverK = Q.divide(K, MC);
        BigDecimal oneMinusQOverK = BigDecimal.ONE.subtract(qOverK);
        BigDecimal maxInventory = optimalS.multiply(oneMinusQOverK, MC).setScale(SCALE, RoundingMode.HALF_UP);

        // === Tính dự trữ trung bình Z = S*(1-Q/K)/2 ===
        BigDecimal avgInventory = maxInventory.divide(BigDecimal.valueOf(2), MC).setScale(SCALE, RoundingMode.HALF_UP);

        // === Tính điểm đặt hàng B = Q*L - m*S* ===
        int m = L.divide(optimalTau, MC).intValue(); // m = floor(L/τ*)
        BigDecimal reorderPoint = Q.multiply(L, MC)
                .subtract(BigDecimal.valueOf(m).multiply(optimalS, MC))
                .setScale(SCALE, RoundingMode.HALF_UP);

        // === Tính chi phí tối ưu D_min = 2*A*n* ===
//        BigDecimal minCost = BigDecimal.valueOf(2).multiply(A).multiply(optimalN, MC)
//                .setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal minCost = (A.multiply(Q).divide(optimalS, MC)).add(I.multiply(C).multiply(optimalS).multiply(BigDecimal.ONE.subtract(qOverK)).divide(BigDecimal.valueOf(2), MC))
                .setScale(SCALE, RoundingMode.HALF_UP);

        // === Tổng chi phí bao gồm mua hàng = D_min + C*Q ===
        BigDecimal totalCostWithPurchase = minCost.add(C.multiply(Q, MC))
                .setScale(SCALE, RoundingMode.HALF_UP);

        // === Thời gian bổ sung một lô Tn = S*/K ===
        BigDecimal replenishmentTime = optimalS.divide(K, MC).setScale(6, RoundingMode.HALF_UP);

        return InventoryCalculationResult.builder()
                .optimalOrderQtyS(optimalS)
                .optimalOrderCountN(optimalN)
                .optimalCycleTimeTau(optimalTau)
                .maxInventoryLevel(maxInventory)
                .avgInventoryLevel(avgInventory)
                .reorderPointB(reorderPoint)
                .minTotalCost(minCost)
                .totalCostWithPurchase(totalCostWithPurchase)
                .replenishmentTimeTn(replenishmentTime)
                .mValue(m)
                // Thông tin tham chiếu
                .demandQ(Q)
                .supplyRateK(K)
                .fixedOrderCostA(A)
                .unitPriceC(C)
                .storageCoefficientI(I)
                .leadTimeL(L)
                .kMinusQFactor(oneMinusQOverK)
                .build();
    }

    /**
     * Tính căn bậc hai bằng BigDecimal (Newton-Raphson)
     */
    private BigDecimal sqrt(BigDecimal value) {
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Không thể tính căn bậc hai của số âm: " + value);
        }
        if (value.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;

        BigDecimal x = new BigDecimal(Math.sqrt(value.doubleValue()), MC);
        BigDecimal two = BigDecimal.valueOf(2);

        // Lặp Newton-Raphson để tăng độ chính xác
        for (int i = 0; i < 10; i++) {
            BigDecimal xNext = x.add(value.divide(x, MC)).divide(two, MC);
            if (xNext.subtract(x).abs().compareTo(BigDecimal.valueOf(1e-10)) < 0) break;
            x = xNext;
        }
        return x;
    }

    private void validate(BigDecimal Q, BigDecimal K, BigDecimal A,
                          BigDecimal C, BigDecimal I, BigDecimal L) {
        if (Q.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Nhu cầu Q phải > 0");
        if (K.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Tốc độ bổ sung K phải > 0");
        if (K.compareTo(Q) <= 0)
            throw new IllegalArgumentException("Tốc độ bổ sung K phải > nhu cầu Q (K > Q)");
        if (A.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Chi phí đặt hàng A phải > 0");
        if (C.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Đơn giá C phải > 0");
        if (I.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Hệ số bảo quản I phải > 0");
        if (L.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Lead time L phải >= 0");
    }
}
