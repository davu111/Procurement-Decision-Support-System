package com.ecotel.inventory_optimization_service.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryVelocityResponse {

    // -------------------------------------------------------
    // SUMMARY — hiển thị ở đầu dashboard
    // -------------------------------------------------------
    private Summary summary;

    // -------------------------------------------------------
    // CHI TIẾT TỪNG SẢN PHẨM — sort theo DIO tăng dần mặc định
    // -------------------------------------------------------
    private List<ProductVelocity> products;

    // -------------------------------------------------------

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Summary {
        private LocalDate analysisFrom;
        private LocalDate analysisTo;
        private int totalProducts;
        private int dataMonths;             // số tháng trong khoảng phân tích

        // Phân phối ABC
        private Map<String, Integer> abcDistribution;      // {A:4, B:6, C:10}
        // Phân phối velocity
        private Map<String, Integer> velocityDistribution; // {FAST:5, NORMAL:10, SLOW:5}
        // Tổng giá trị tiêu thụ toàn bộ danh mục trong kỳ
        private BigDecimal totalConsumptionValue;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProductVelocity {

        // --- Định danh ---
        private String productId;
        private String productName;
        private String unit;
        private String categoryName;

        // --- Phân loại ---

        /**
         * ABC class dựa trên giá trị tiêu thụ (consumption × unitPrice):
         *   A = top 80% giá trị toàn danh mục
         *   B = tiếp theo 15%
         *   C = còn lại 5%
         */
        private String abcClass;            // A | B | C

        /**
         * Velocity class dựa trên DIO so với median của toàn danh mục:
         *   FAST   : DIO < median × 0.6
         *   NORMAL : DIO trong [median×0.6, median×1.5]
         *   SLOW   : DIO > median × 1.5
         */
        private String velocityClass;       // FAST | NORMAL | SLOW

        /**
         * Trend dựa trên so sánh avgConsumption(3 tháng gần nhất)
         * vs avgConsumption(3 tháng liền trước đó):
         *   GROWING  : tăng > 10%
         *   DECLINING: giảm > 10%
         *   STABLE   : biến động trong ±10%
         */
        private String trend;               // GROWING | STABLE | DECLINING

        // --- Chỉ số tiêu thụ ---
        private BigDecimal totalConsumption;        // tổng tiêu thụ trong kỳ phân tích
        private BigDecimal avgMonthlyConsumption;   // trung bình tháng
        private BigDecimal totalConsumptionValue;   // totalConsumption × unitPrice
        private BigDecimal unitPrice;

        // Trend detail
        private BigDecimal recentAvgConsumption;    // avg 3 tháng gần nhất
        private BigDecimal previousAvgConsumption;  // avg 3 tháng trước đó
        private BigDecimal trendRate;               // % thay đổi (0.15 = +15%)

        // --- Chỉ số tồn kho ---
        private BigDecimal avgInventory;            // tồn kho trung bình trong kỳ
        private String     inventorySource;         // STOCK_COUNT | SIMULATED | THEORETICAL

        /**
         * Inventory Turnover Ratio = totalConsumption / avgInventory
         * Cao → luân chuyển nhanh
         */
        private BigDecimal turnoverRatio;

        /**
         * Days Inventory Outstanding (DIO) = avgInventory / (avgMonthlyConsumption / 30)
         * Thấp → hàng tiêu thụ nhanh
         * Đơn vị: ngày
         */
        private BigDecimal daysInventoryOutstanding;

        // --- Metadata ---
        private int dataPointsUsed;         // số tháng có dữ liệu actualConsumption
        private boolean insufficientData;   // true nếu < 3 tháng (kết quả kém tin cậy)
    }
}
