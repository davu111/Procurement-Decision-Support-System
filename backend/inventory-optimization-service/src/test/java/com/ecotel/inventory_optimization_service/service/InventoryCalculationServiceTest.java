package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho thuật toán mô hình bổ sung dần
 * Dùng ví dụ 2 từ tài liệu để verify:
 *   Q=500*360=180000 đv/năm, K=800*360=288000 đv/năm
 *   A=100 nghìn đồng, IC = 1.2*360 = 432 nghìn/đv/năm
 */
class InventoryCalculationServiceTest {

    private InventoryCalculationService service;
    private InventoryParameter param;

    @BeforeEach
    void setup() {
        service = new InventoryCalculationService();

        Product product = Product.builder()
                .id(1L)
                .code("HH001")
                .name("Hàng hóa test")
                .unitPrice(new BigDecimal("1")) // C=1 (gộp vào I*C)
                .build();

        // Ví dụ 2 từ tài liệu (đơn vị: ngày)
        // Q = 500 đv/ngày, K = 800 đv/ngày, A = 100, I*C = 1.2
        param = InventoryParameter.builder()
                .product(product)
                .planningUnit(PlanningUnit.YEAR)
                .planStartDate(LocalDate.of(2025, 1, 1))
                .demandQ(new BigDecimal("180000"))    // 500 × 360
                .supplyRateK(new BigDecimal("288000")) // 800 × 360
                .fixedOrderCostA(new BigDecimal("100"))
                .storageCostCoefficientI(new BigDecimal("1.2")) // I*C = 1.2 (C=1)
                .leadTimeL(new BigDecimal("0"))
                .build();
    }

    @Test
    @DisplayName("Tính S* - lượng đặt hàng tối ưu")
    void testOptimalOrderQuantity() {
        InventoryCalculationResult result = service.calculate(param);

        // S* = sqrt(2*100*180000/1.2 × 288000/(288000-180000))
        //    = sqrt(30000000 × 2.666...) = sqrt(80000000) ≈ 894.43
        assertNotNull(result.getOptimalOrderQtyS());
        assertTrue(result.getOptimalOrderQtyS().doubleValue() > 0,
                "S* phải > 0");

        // Kiểm tra điều kiện K > Q
        assertTrue(param.getSupplyRateK().compareTo(param.getDemandQ()) > 0,
                "K phải > Q");
    }

    @Test
    @DisplayName("Kiểm tra mối quan hệ n* = Q/S*")
    void testOrderCountRelation() {
        InventoryCalculationResult result = service.calculate(param);

        double q = param.getDemandQ().doubleValue();
        double sOptimal = result.getOptimalOrderQtyS().doubleValue();
        double nOptimal = result.getOptimalOrderCountN().doubleValue();

        assertEquals(q / sOptimal, nOptimal, 0.01,
                "n* phải bằng Q/S*");
    }

    @Test
    @DisplayName("Kiểm tra τ* = 1/n*")
    void testCycleTimeRelation() {
        InventoryCalculationResult result = service.calculate(param);

        double nOptimal = result.getOptimalOrderCountN().doubleValue();
        double tauOptimal = result.getOptimalCycleTimeTau().doubleValue();

        assertEquals(1.0 / nOptimal, tauOptimal, 0.0001,
                "τ* phải bằng 1/n*");
    }

    @Test
    @DisplayName("Kiểm tra dự trữ trung bình Z = S*(1-Q/K)/2")
    void testAvgInventory() {
        InventoryCalculationResult result = service.calculate(param);

        double sOptimal = result.getOptimalOrderQtyS().doubleValue();
        double q = param.getDemandQ().doubleValue();
        double k = param.getSupplyRateK().doubleValue();
        double expectedZ = sOptimal * (1 - q / k) / 2;

        assertEquals(expectedZ, result.getAvgInventoryLevel().doubleValue(), 0.01,
                "Z phải bằng S*(1-Q/K)/2");
    }

    @Test
    @DisplayName("Kiểm tra D_min = 2*A*n*")
    void testMinCost() {
        InventoryCalculationResult result = service.calculate(param);

        double a = param.getFixedOrderCostA().doubleValue();
        double nOptimal = result.getOptimalOrderCountN().doubleValue();
        double expectedDmin = 2 * a * nOptimal;

        assertEquals(expectedDmin, result.getMinTotalCost().doubleValue(), 0.01,
                "D_min phải bằng 2*A*n*");
    }

    @Test
    @DisplayName("Validation - K phải > Q")
    void testValidationKGreaterThanQ() {
        param.setSupplyRateK(new BigDecimal("100000")); // K < Q → lỗi
        assertThrows(IllegalArgumentException.class,
                () -> service.calculate(param),
                "Phải throw exception khi K <= Q");
    }

    @Test
    @DisplayName("Validation - Q phải > 0")
    void testValidationQPositive() {
        param.setDemandQ(BigDecimal.ZERO);
        assertThrows(IllegalArgumentException.class,
                () -> service.calculate(param));
    }
}
