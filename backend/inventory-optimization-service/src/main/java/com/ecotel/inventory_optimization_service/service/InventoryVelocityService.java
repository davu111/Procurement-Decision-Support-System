package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.InventoryVelocityResponse;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.model.StockCount;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryResultRepository;
import com.ecotel.inventory_optimization_service.repository.StockCountRepository;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryVelocityService {

    private final ConsumptionHistoryRepository consumptionRepo;
    private final InventoryParameterRepository parameterRepo;
    private final InventoryResultRepository resultRepo;
    private final StockCountRepository stockCountRepo;
    private final ProductService productService;

    // Ngưỡng velocity so với median DIO
    private static final double FAST_THRESHOLD = 0.6;
    private static final double SLOW_THRESHOLD = 1.5;
    // Ngưỡng trend
    private static final double TREND_THRESHOLD = 0.10;  // ±10%
    // Ngưỡng ABC (cumulative %)
    private static final double ABC_A_CUT = 0.80;
    private static final double ABC_B_CUT = 0.95;
    // Số tháng tối thiểu để kết quả tin cậy
    private static final int MIN_DATA_POINTS = 3;

    // -------------------------------------------------------

    /**
     * Phân tích velocity + ABC cho toàn bộ (hoặc một phần) danh mục.
     *
     * @param from          ngày bắt đầu kỳ phân tích
     * @param to            ngày kết thúc kỳ phân tích
     * @param categoryId    lọc theo danh mục (null = tất cả)
     * @param velocityFilter lọc kết quả theo velocity class (null = tất cả)
     * @param abcFilter     lọc kết quả theo ABC class (null = tất cả)
     */
    public InventoryVelocityResponse analyze(
            LocalDate from, LocalDate to,
            String categoryId,
            String velocityFilter,
            String abcFilter) {

        // 1. Lấy danh sách sản phẩm cần phân tích
        List<ProductResponse> products = productService.getActiveTrue()
                .stream()
                .filter(product -> categoryId == null || categoryId.equals(product.getCategoryId()))
                .toList();

        int dataMonths = (int) ChronoUnit.MONTHS.between(from, to) + 1;

        // 2. Tính metrics từng sản phẩm
        List<InventoryVelocityResponse.ProductVelocity> velocities = products.stream()
                .map(p -> buildProductVelocity(p, from, to))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (velocities.isEmpty()) {
            return InventoryVelocityResponse.builder()
                    .summary(InventoryVelocityResponse.Summary.builder()
                            .analysisFrom(from).analysisTo(to)
                            .totalProducts(0).dataMonths(dataMonths)
                            .abcDistribution(Map.of("A",0,"B",0,"C",0))
                            .velocityDistribution(Map.of("FAST",0,"NORMAL",0,"SLOW",0))
                            .totalConsumptionValue(BigDecimal.ZERO)
                            .build())
                    .products(List.of())
                    .build();
        }

        // 3. ABC classification — cần tổng giá trị toàn danh mục trước
        classifyABC(velocities);

        // 4. Velocity classification — dùng median DIO
        classifyVelocity(velocities);

        // 5. Apply filters
        List<InventoryVelocityResponse.ProductVelocity> filtered = velocities.stream()
                .filter(v -> velocityFilter == null || velocityFilter.equalsIgnoreCase(v.getVelocityClass()))
                .filter(v -> abcFilter == null || abcFilter.equalsIgnoreCase(v.getAbcClass()))
                .sorted(Comparator.comparing(v ->
                        v.getDaysInventoryOutstanding() != null
                                ? v.getDaysInventoryOutstanding()
                                : BigDecimal.valueOf(9999)))
                .collect(Collectors.toList());

        // 6. Build summary
        InventoryVelocityResponse.Summary summary = buildSummary(velocities, from, to, dataMonths);

        return InventoryVelocityResponse.builder()
                .summary(summary)
                .products(filtered)
                .build();
    }

    // -------------------------------------------------------
    // BUILD METRICS TỪNG SẢN PHẨM
    // -------------------------------------------------------

    private InventoryVelocityResponse.ProductVelocity buildProductVelocity(ProductResponse product, LocalDate from, LocalDate to) {
        // Lấy lịch sử tiêu thụ trong kỳ, sort tăng dần
        List<ConsumptionHistory> history = consumptionRepo
                .findByProductIdAndDateRange(product.getId(), from, to);

        if (history.isEmpty()) {
            log.debug("Không có lịch sử tiêu thụ cho productId={} trong [{},{}]",
                    product.getId(), from, to);
            return null;  // bỏ qua sản phẩm không có dữ liệu
        }

        int n = history.size();
        boolean insufficientData = n < MIN_DATA_POINTS;

        // --- Consumption metrics ---
        double totalCons = history.stream()
                .mapToDouble(h -> h.getActualConsumption().doubleValue())
                .sum();
        double avgMonthlyCons = totalCons / n;

        // Trend: 3 tháng gần nhất vs 3 tháng liền trước
        double recentAvg  = tailAvg(history, 3);
        double previousAvg = tailAvg(history, 6, 3);
        double trendRate = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
        String trend = trendRate > TREND_THRESHOLD ? "GROWING"
                : trendRate < -TREND_THRESHOLD ? "DECLINING"
                : "STABLE";

        // --- Unit price & consumption value ---
        Optional<InventoryParameter> paramOpt = parameterRepo.findLatestActive(product.getId()).stream().findFirst();
        BigDecimal unitPrice = paramOpt
                .map(InventoryParameter::getSnapshotUnitPriceC)
                .orElse(BigDecimal.ZERO);
        BigDecimal totalConsValue = BigDecimal.valueOf(totalCons).multiply(unitPrice);

        // --- Avg inventory ---
        AvgInventoryResult avgInvResult = resolveAvgInventory(product.getId(), from, to, paramOpt);

        // --- DIO & Turnover ---
        BigDecimal avgInv    = avgInvResult.value;
        BigDecimal turnover  = null;
        BigDecimal dio       = null;

        if (avgInv != null && avgInv.compareTo(BigDecimal.ZERO) > 0 && avgMonthlyCons > 0) {
            double avgInvD = avgInv.doubleValue();
            turnover = BigDecimal.valueOf(totalCons / avgInvD).setScale(2, RoundingMode.HALF_UP);
            // DIO = avgInv / (avgMonthlyCons / 30)
            double dailyCons = avgMonthlyCons / 30.0;
            dio = BigDecimal.valueOf(avgInvD / dailyCons).setScale(1, RoundingMode.HALF_UP);
        }

        return InventoryVelocityResponse.ProductVelocity.builder()
                .productId(product.getId())
                .productName(product.getProductName())
                .unit(product.getUnit())
                .categoryName(product.getCategoryName())
                .totalConsumption(BigDecimal.valueOf(totalCons).setScale(2, RoundingMode.HALF_UP))
                .avgMonthlyConsumption(BigDecimal.valueOf(avgMonthlyCons).setScale(2, RoundingMode.HALF_UP))
                .totalConsumptionValue(totalConsValue.setScale(0, RoundingMode.HALF_UP))
                .unitPrice(unitPrice)
                .recentAvgConsumption(BigDecimal.valueOf(recentAvg).setScale(2, RoundingMode.HALF_UP))
                .previousAvgConsumption(BigDecimal.valueOf(previousAvg).setScale(2, RoundingMode.HALF_UP))
                .trendRate(BigDecimal.valueOf(trendRate).setScale(4, RoundingMode.HALF_UP))
                .trend(trend)
                .avgInventory(avgInv)
                .inventorySource(avgInvResult.source)
                .turnoverRatio(turnover)
                .daysInventoryOutstanding(dio)
                .dataPointsUsed(n)
                .insufficientData(insufficientData)
                // abcClass và velocityClass sẽ được set sau (cần toàn bộ danh sách)
                .abcClass(null)
                .velocityClass(null)
                .build();
    }

    // -------------------------------------------------------
    // ABC CLASSIFICATION
    // -------------------------------------------------------

    private void classifyABC(List<InventoryVelocityResponse.ProductVelocity> velocities) {
        double totalValue = velocities.stream()
                .filter(v -> v.getTotalConsumptionValue() != null)
                .mapToDouble(v -> v.getTotalConsumptionValue().doubleValue())
                .sum();

        if (totalValue == 0) {
            velocities.forEach(v -> v.setAbcClass("C"));
            return;
        }

        // Sort theo giá trị giảm dần để tính cumulative
        List<InventoryVelocityResponse.ProductVelocity> sorted = velocities.stream()
                .sorted(Comparator.comparing(
                        v -> v.getTotalConsumptionValue() != null
                                ? v.getTotalConsumptionValue()
                                : BigDecimal.ZERO,
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());

        double cumulative = 0;
        for (InventoryVelocityResponse.ProductVelocity v : sorted) {
            if (v.getTotalConsumptionValue() != null) {
                cumulative += v.getTotalConsumptionValue().doubleValue();
            }
            double cumulativePct = cumulative / totalValue;
            String abcClass = cumulativePct <= ABC_A_CUT ? "A"
                    : cumulativePct <= ABC_B_CUT ? "B"
                    : "C";
            v.setAbcClass(abcClass);
        }
    }

    // -------------------------------------------------------
    // VELOCITY CLASSIFICATION — dùng median DIO
    // -------------------------------------------------------

    private void classifyVelocity(List<InventoryVelocityResponse.ProductVelocity> velocities) {
        List<Double> dioList = velocities.stream()
                .filter(v -> v.getDaysInventoryOutstanding() != null)
                .map(v -> v.getDaysInventoryOutstanding().doubleValue())
                .sorted()
                .collect(Collectors.toList());

        if (dioList.isEmpty()) {
            velocities.forEach(v -> v.setVelocityClass("NORMAL"));
            return;
        }

        double medianDio = dioList.size() % 2 == 0
                ? (dioList.get(dioList.size()/2 - 1) + dioList.get(dioList.size()/2)) / 2.0
                : dioList.get(dioList.size()/2);

        for (InventoryVelocityResponse.ProductVelocity v : velocities) {
            if (v.getDaysInventoryOutstanding() == null) {
                v.setVelocityClass("NORMAL");
                continue;
            }
            double dio = v.getDaysInventoryOutstanding().doubleValue();
            v.setVelocityClass(
                    dio < medianDio * FAST_THRESHOLD ? "FAST"
                            : dio > medianDio * SLOW_THRESHOLD ? "SLOW"
                            : "NORMAL");
        }
    }

    // -------------------------------------------------------
    // RESOLVE AVG INVENTORY
    // -------------------------------------------------------

    private AvgInventoryResult resolveAvgInventory(
            String productId, LocalDate from, LocalDate to,
            Optional<InventoryParameter> paramOpt) {

        // Ưu tiên 1: trung bình từ các phiếu kiểm kê CONFIRMED trong kỳ
        List<StockCount> stockCounts = stockCountRepo
                .findConfirmedInRange(productId, from, to);

        if (!stockCounts.isEmpty()) {
            double avg = stockCounts.stream()
                    .mapToDouble(s -> s.getActualQuantity().doubleValue())
                    .average().orElse(0);
            return new AvgInventoryResult(
                    BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP),
                    "STOCK_COUNT");
        }

        // Ưu tiên 2: avgInventoryLevel từ InventoryResult (lý thuyết)
        if (paramOpt.isPresent()) {
            Optional<InventoryResult> resultOpt =
                    resultRepo.findByInventoryParameterId(paramOpt.get().getId());
            if (resultOpt.isPresent()) {
                return new AvgInventoryResult(
                        resultOpt.get().getAvgInventoryLevel(),
                        "THEORETICAL");
            }
        }

        return new AvgInventoryResult(null, "UNAVAILABLE");
    }

    // -------------------------------------------------------
    // BUILD SUMMARY
    // -------------------------------------------------------

    private InventoryVelocityResponse.Summary buildSummary(List<InventoryVelocityResponse.ProductVelocity> all,
                                                           LocalDate from, LocalDate to, int dataMonths) {
        Map<String, Integer> abcDist = Map.of(
                "A", (int) all.stream().filter(v -> "A".equals(v.getAbcClass())).count(),
                "B", (int) all.stream().filter(v -> "B".equals(v.getAbcClass())).count(),
                "C", (int) all.stream().filter(v -> "C".equals(v.getAbcClass())).count());

        Map<String, Integer> velDist = Map.of(
                "FAST",   (int) all.stream().filter(v -> "FAST".equals(v.getVelocityClass())).count(),
                "NORMAL", (int) all.stream().filter(v -> "NORMAL".equals(v.getVelocityClass())).count(),
                "SLOW",   (int) all.stream().filter(v -> "SLOW".equals(v.getVelocityClass())).count());

        BigDecimal totalValue = all.stream()
                .filter(v -> v.getTotalConsumptionValue() != null)
                .map(InventoryVelocityResponse.ProductVelocity::getTotalConsumptionValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return InventoryVelocityResponse.Summary.builder()
                .analysisFrom(from).analysisTo(to)
                .totalProducts(all.size())
                .dataMonths(dataMonths)
                .abcDistribution(abcDist)
                .velocityDistribution(velDist)
                .totalConsumptionValue(totalValue)
                .build();
    }

    // -------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------

    /** Trung bình của `count` phần tử cuối cùng trong list */
    private double tailAvg(List<ConsumptionHistory> history, int count) {
        int size = history.size();
        int from = Math.max(0, size - count);
        return history.subList(from, size).stream()
                .mapToDouble(h -> h.getActualConsumption().doubleValue())
                .average().orElse(0);
    }

    /** Trung bình của `count` phần tử, tính ngược từ vị trí `skipLast` */
    private double tailAvg(List<ConsumptionHistory> history, int skipLast, int skipFirst) {
        int size = history.size();
        int to   = Math.max(0, size - skipFirst);
        int from = Math.max(0, to - (skipLast - skipFirst));
        if (from >= to) return 0;
        return history.subList(from, to).stream()
                .mapToDouble(h -> h.getActualConsumption().doubleValue())
                .average().orElse(0);
    }

    private record AvgInventoryResult(BigDecimal value, String source) {}
}
