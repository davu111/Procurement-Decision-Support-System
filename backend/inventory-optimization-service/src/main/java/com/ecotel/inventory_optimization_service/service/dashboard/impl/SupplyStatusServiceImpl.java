package com.ecotel.inventory_optimization_service.service.dashboard.impl;

import com.ecotel.inventory_optimization_service.dto.response.dashboard.SupplyStatusResponse;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryResultRepository;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import com.ecotel.inventory_optimization_service.service.warehouse.WarehouseServiceClient;
import com.ecotel.inventory_optimization_service.service.dashboard.SupplyStatusService;
import com.ecotel.inventory_optimization_service.service.impl.InventoryPlanningService;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Triển khai Supply Status Dashboard.
 *
 * Luồng cho mỗi product:
 *   1. Load InventoryParameter ACTIVE gần nhất
 *   2. Load InventoryResult (để lấy reorderPointB)
 *   3. currentInventory:
 *        Ưu tiên 1 — warehouse-service real-time (GET /api/inventories/quantity/{productId})
 *        Fallback   — simulateInventoryAt(today) nếu warehouse-service không sẵn sàng
 *   4. pendingReceipts   = findPendingReceipts(productId, today)
 *   5. Tính DOS_raw, DOS_effective, status, processAlert
 *   6. nextScheduledOrderDate = đơn hiệu lực gần nhất có orderDate > today
 *   7. Sort: CRITICAL → WARNING → OK, rồi DOS_raw tăng dần
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplyStatusServiceImpl implements SupplyStatusService {

    private static final BigDecimal DAYS_IN_MONTH = BigDecimal.valueOf(30);
    /** Hệ số ngưỡng WARNING: DOS_raw < committedLeadTimeDays * WARNING_MULTIPLIER */
    private static final double WARNING_MULTIPLIER = 1.5;
    /** Horizon tìm đơn hàng tiếp theo */
    private static final int NEXT_ORDER_HORIZON_YEARS = 2;

    private final InventoryParameterRepository parameterRepository;
    private final InventoryResultRepository resultRepository;
    private final OrderScheduleRepository scheduleRepository;
    private final InventoryPlanningService planningService;
    private final ProductService productService;
    private final WarehouseServiceClient warehouseServiceClient;

    // ──────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────────────────────────

    @Override
    public List<SupplyStatusResponse> getSupplyStatus(List<String> productIds, String categoryId) {
        LocalDate today = LocalDate.now();

        // Resolve danh sách productId cần xử lý
        List<String> targetProductIds = resolveProductIds(productIds);
        if (targetProductIds.isEmpty()) {
            log.info("[SupplyStatus] Không có sản phẩm nào có kế hoạch ACTIVE.");
            return Collections.emptyList();
        }

        // Batch fetch tên sản phẩm một lần duy nhất để tránh N+1 request
        Map<String, String> productNameMap = fetchProductNames(targetProductIds);

        // Build response cho từng sản phẩm
        List<SupplyStatusResponse> results = targetProductIds.stream()
                .map(productId -> buildSupplyStatus(productId, today, productNameMap))
                .filter(Objects::nonNull)   // skip sản phẩm không có kế hoạch ACTIVE
                .collect(Collectors.toList());

        // Sort: CRITICAL → WARNING → OK, trong cùng nhóm sort DOS_raw tăng dần
        results.sort(Comparator
                .comparingInt((SupplyStatusResponse r) -> statusOrder(r.getStatus()))
                .thenComparing(r -> r.getDaysOfSupply() != null ? r.getDaysOfSupply() : BigDecimal.valueOf(Double.MAX_VALUE)));

        log.info("[SupplyStatus] Trả về {} sản phẩm (CRITICAL={}, WARNING={}, OK={})",
                results.size(),
                countByStatus(results, "CRITICAL"),
                countByStatus(results, "WARNING"),
                countByStatus(results, "OK"));

        return results;
    }

    // ──────────────────────────────────────────────────────────────────────
    // CORE LOGIC
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Build SupplyStatusResponse cho một sản phẩm.
     * Trả về null nếu không có kế hoạch ACTIVE (sản phẩm không được quản lý).
     */
    private SupplyStatusResponse buildSupplyStatus(String productId, LocalDate today,
                                                    Map<String, String> productNameMap) {
        // 1. Load kế hoạch ACTIVE gần nhất
        InventoryParameter param = parameterRepository
                .findLatestActive(productId)
                .stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .findFirst()
                .orElse(null);

        if (param == null) {
            log.debug("[SupplyStatus] productId={} không có kế hoạch ACTIVE, skip.", productId);
            return null;
        }

        // 2. Load InventoryResult để lấy reorderPointB
        InventoryResult result = resultRepository
                .findByInventoryParameterId(param.getId())
                .orElse(null);

        if (result == null) {
            log.warn("[SupplyStatus] productId={} có ACTIVE param nhưng không có InventoryResult, skip.", productId);
            return null;
        }

        // 3. currentInventory: StockCount CONFIRMED gần nhất → fallback simulate
        CurrentInventoryData inventoryData = resolveCurrentInventory(productId, today);

        // 4. pendingReceipts: lô đang trên đường về (đã đặt nhưng chưa nhận)
        List<OrderSchedule> pendingSchedules = scheduleRepository.findPendingReceipts(productId, today);

        // 5. Tính toán chỉ số DOS
        List<OrderSchedule> allSchedules = scheduleRepository.findByInventoryResultIdOrderByOrderSequenceAsc(result.getId());
        BigDecimal dailyConsumption = calculateSawtoothDailyConsumption(result, param, allSchedules);

        // committedLeadTimeDays = L (tháng) * 30 ngày
        BigDecimal committedLeadTimeDays = param.getSnapshotLeadTimeL()
                .multiply(DAYS_IN_MONTH)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal dosRaw = calculateDOS(inventoryData.quantity, dailyConsumption);

        BigDecimal pendingTotalQty = pendingSchedules.stream()
                .map(OrderSchedule::getOrderQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dosEffective = calculateDOS(
                inventoryData.quantity.add(pendingTotalQty), dailyConsumption);

        // 6. Status (dùng DOS_effective để tránh cảnh báo sai khi đơn hàng đã được đặt và sắp về)
        String status = calculateStatus(dosEffective, committedLeadTimeDays);

        // 7. processAlert: dưới B mà không có lô nào đã được đặt sắp về
//        boolean hasUpcomingDelivery = allSchedules.stream()
//                .anyMatch(s -> !s.getOrderDate().isAfter(today)
//                        && !s.getExpectedDeliveryDate().isBefore(today));
        boolean hasUpcomingDelivery = allSchedules.stream()
                .anyMatch(r -> !r.getExpectedDeliveryDate().isBefore(today));
        boolean processAlert = inventoryData.quantity.compareTo(result.getReorderPointB()) < 0
                && !hasUpcomingDelivery;

        // 8. nextScheduledOrderDate: đơn hiệu lực gần nhất có orderDate > today
        LocalDate nextOrderDate = findNextScheduledOrderDate(productId, today);

        // 9. Build pending receipts DTO
        List<SupplyStatusResponse.PendingReceiptDto> pendingReceiptDtos = pendingSchedules.stream()
                .map(s -> SupplyStatusResponse.PendingReceiptDto.builder()
                        .expectedDeliveryDate(s.getExpectedDeliveryDate())
                        .quantity(s.getOrderQuantity())
                        // isDelayed: chưa nhận (actualDeliveryDate null) VÀ đã qua ngày dự kiến
                        .isDelayed(s.getActualDeliveryDate() == null
                                && s.getExpectedDeliveryDate().isBefore(today))
                        .build())
                .collect(Collectors.toList());

        String productName = productNameMap.getOrDefault(productId, productId);

        return SupplyStatusResponse.builder()
                .productId(productId)
                .productName(productName)
                .currentInventory(inventoryData.quantity.setScale(2, RoundingMode.HALF_UP))
                .inventorySource(inventoryData.source)
                .lastStockCountDate(inventoryData.stockCountDate)
                .dailyConsumption(dailyConsumption)
                .daysOfSupply(dosRaw)
                .daysOfSupplyEffective(dosEffective)
                .committedLeadTimeDays(committedLeadTimeDays)
                .status(status)
                .pendingReceipts(pendingReceiptDtos)
                .nextScheduledOrderDate(nextOrderDate)
                .processAlert(processAlert)
                .build();
    }

    /**
     * Tính toán lượng tiêu hao hàng ngày (daily consumption) khớp chính xác với cách vẽ SawtoothChart.
     */
    private BigDecimal calculateSawtoothDailyConsumption(InventoryResult result, InventoryParameter param, List<OrderSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return param.getDemandQ().divide(DAYS_IN_MONTH, 4, RoundingMode.HALF_UP);
        }

        // Sắp xếp các lịch đặt hàng theo ngày để khớp với SawtoothChart
        List<OrderSchedule> sorted = schedules.stream()
                .sorted(Comparator.comparing(OrderSchedule::getOrderDate))
                .collect(Collectors.toList());

        OrderSchedule first = sorted.get(0);
        long lDays = java.time.temporal.ChronoUnit.DAYS.between(first.getOrderDate(), first.getExpectedDeliveryDate());
        if (lDays <= 0) {
            return param.getDemandQ().divide(DAYS_IN_MONTH, 4, RoundingMode.HALF_UP);
        }

        long tauDays;
        if (sorted.size() >= 2) {
            tauDays = java.time.temporal.ChronoUnit.DAYS.between(sorted.get(0).getOrderDate(), sorted.get(1).getOrderDate());
        } else {
            double leadTimeL = param.getSnapshotLeadTimeL() != null ? param.getSnapshotLeadTimeL().doubleValue() : 0.0;
            double optimalCycleTimeTau = result.getOptimalCycleTimeTau() != null ? result.getOptimalCycleTimeTau().doubleValue() : 0.0;
            tauDays = Math.round((optimalCycleTimeTau / Math.max(leadTimeL, 0.001)) * lDays);
        }

        if (tauDays <= 0) {
            return param.getDemandQ().divide(DAYS_IN_MONTH, 4, RoundingMode.HALF_UP);
        }

        double leadTimeL = param.getSnapshotLeadTimeL() != null ? param.getSnapshotLeadTimeL().doubleValue() : 0.0;
        long daysPerPeriod = leadTimeL > 0 ? Math.round(lDays / leadTimeL) : 30;

        double replenishmentTimeTn = result.getReplenishmentTimeTn() != null ? result.getReplenishmentTimeTn().doubleValue() : 0.0;
        long tnDays = Math.max(1, Math.round(replenishmentTimeTn * daysPerPeriod));
        long ttDays = Math.max(1, tauDays - tnDays);

        double maxLevel = result.getMaxInventoryLevel() != null ? result.getMaxInventoryLevel().doubleValue() : 0.0;
        double dailyFall = maxLevel / ttDays;

        return BigDecimal.valueOf(dailyFall).setScale(4, RoundingMode.HALF_UP);
    }

    // ──────────────────────────────────────────────────────────────────────
    // HELPERS — Inventory Resolution
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Resolve tồn kho hiện tại theo thứ tự ưu tiên:
     *   Ưu tiên 1: warehouse-service real-time (phản ánh đúng thực tế vật lý trong kho)
     *   Fallback:  simulateInventoryAt(today) — khi warehouse-service không sẵn sàng (down/timeout)
     *   Fallback cuối: BigDecimal.ZERO
     */
    private CurrentInventoryData resolveCurrentInventory(String productId, LocalDate today) {
        // Ưu tiên 1: lấy tồn kho thực tế từ warehouse-service
        try {
            BigDecimal warehouseQty = warehouseServiceClient.getInventoryQuantityByProductId(productId);
            if (warehouseQty != null) {
                log.debug("[SupplyStatus] productId={} dùng WAREHOUSE real-time qty={}", productId, warehouseQty);
                return new CurrentInventoryData(warehouseQty, "WAREHOUSE", null);
            }
            log.warn("[SupplyStatus] productId={} warehouse-service trả về null, fallback simulate.", productId);
        } catch (Exception e) {
            log.warn("[SupplyStatus] productId={} không thể gọi warehouse-service ({}), fallback simulate.",
                    productId, e.getMessage());
        }

        // Fallback: mô phỏng tồn kho tại today
        BigDecimal simulated = planningService.simulateInventoryAt(productId, today);
        if (simulated != null) {
            log.debug("[SupplyStatus] productId={} dùng SIMULATED inventory={}", productId, simulated);
            return new CurrentInventoryData(simulated, "SIMULATED", null);
        }

        // Fallback cuối: không có dữ liệu
        log.warn("[SupplyStatus] productId={} không có dữ liệu tồn kho (warehouse lẫn simulation)", productId);
        return new CurrentInventoryData(BigDecimal.ZERO, "SIMULATED", null);
    }

    // ──────────────────────────────────────────────────────────────────────
    // HELPERS — Calculation
    // ──────────────────────────────────────────────────────────────────────

    /**
     * DOS = inventory / dailyConsumption.
     * Trả về null nếu dailyConsumption = 0 (tránh ArithmeticException).
     */
    private BigDecimal calculateDOS(BigDecimal inventory, BigDecimal dailyConsumption) {
        if (dailyConsumption == null || dailyConsumption.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        if (inventory == null || inventory.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return inventory.divide(dailyConsumption, 2, RoundingMode.HALF_UP);
    }

    /**
     * Tính status dựa trên DOS_raw và committedLeadTimeDays.
     *   CRITICAL: DOS_raw < committedLeadTimeDays
     *   WARNING:  DOS_raw < committedLeadTimeDays * WARNING_MULTIPLIER
     *   OK:       còn lại
     */
    private String calculateStatus(BigDecimal dosRaw, BigDecimal committedLeadTimeDays) {
        if (dosRaw == null) return "OK";

        BigDecimal warningThreshold = committedLeadTimeDays
                .multiply(BigDecimal.valueOf(WARNING_MULTIPLIER))
                .setScale(2, RoundingMode.HALF_UP);

        if (dosRaw.compareTo(committedLeadTimeDays) < 0) {
            return "CRITICAL";
        } else if (dosRaw.compareTo(warningThreshold) < 0) {
            return "WARNING";
        } else {
            return "OK";
        }
    }

    /**
     * Tìm ngày đặt hàng tiếp theo trong lịch hiệu lực sau today.
     */
    private LocalDate findNextScheduledOrderDate(String productId, LocalDate today) {
        LocalDate horizon = today.plusYears(NEXT_ORDER_HORIZON_YEARS);
        List<OrderSchedule> futureSchedules = scheduleRepository
                .findEffectiveByProductIdAndDateRange(productId, today.plusDays(1), horizon);

        return futureSchedules.stream()
                .map(OrderSchedule::getOrderDate)
                .filter(d -> d.isAfter(today))
                .min(LocalDate::compareTo)
                .orElse(null);
    }

    // ──────────────────────────────────────────────────────────────────────
    // HELPERS — Product Resolution & Sorting
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Resolve danh sách productId:
     *   - Nếu productIds được truyền vào → dùng luôn
     *   - Ngược lại → lấy tất cả products có kế hoạch ACTIVE
     */
    private List<String> resolveProductIds(List<String> productIds) {
        if (productIds != null && !productIds.isEmpty()) {
            return productIds;
        }
        return parameterRepository.findAllActiveProductIds();
    }

    /**
     * Batch fetch tên sản phẩm từ product-service.
     * Trả về map rỗng nếu có lỗi (dashboard không bị fail vì thiếu tên).
     */
    private Map<String, String> fetchProductNames(List<String> productIds) {
        try {
            Map<String, ProductResponse> productMap = productService.getProductMapByIds(productIds);
            if (productMap == null) return Collections.emptyMap();
            return productMap.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue() != null && e.getValue().getProductName() != null
                                    ? e.getValue().getProductName()
                                    : e.getKey()
                    ));
        } catch (Exception e) {
            log.warn("[SupplyStatus] Không thể fetch tên sản phẩm: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    /** Thứ tự sort: CRITICAL=0, WARNING=1, OK=2 */
    private int statusOrder(String status) {
        return switch (status != null ? status : "OK") {
            case "CRITICAL" -> 0;
            case "WARNING"  -> 1;
            default         -> 2;
        };
    }

    private long countByStatus(List<SupplyStatusResponse> list, String status) {
        return list.stream().filter(r -> status.equals(r.getStatus())).count();
    }

    // ──────────────────────────────────────────────────────────────────────
    // VALUE OBJECT
    // ──────────────────────────────────────────────────────────────────────

    /** Kết quả resolve tồn kho hiện tại gồm số lượng và nguồn */
    private record CurrentInventoryData(
            BigDecimal quantity,
            String source,          // WAREHOUSE | SIMULATED
            LocalDate stockCountDate // luôn null (reserved, không dùng nữa)
    ) {}
}
