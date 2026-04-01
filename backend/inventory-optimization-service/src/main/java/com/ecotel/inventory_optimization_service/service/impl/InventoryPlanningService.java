package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.request.supplier.SupplierProductData;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.dto.response.ForecastSuggestionResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.model.*;
import com.ecotel.inventory_optimization_service.repository.*;
import com.ecotel.inventory_optimization_service.service.InventoryCalculationService;
import com.ecotel.inventory_optimization_service.service.forecast.ForecastOrchestrator;
import com.ecotel.inventory_optimization_service.service.supplier.SupplierServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryPlanningService {

    private final InventoryParameterRepository parameterRepository;
    private final InventoryResultRepository resultRepository;
    private final OrderScheduleRepository scheduleRepository;
    private final ProductRepository productRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;
    private final InventoryCalculationService calculationService;
    private final ForecastOrchestrator forecastOrchestrator;
    private final SupplierServiceClient supplierServiceClient;

    @Transactional
    public InventoryCalculationResult createAndCalculate(InventoryParameterRequest request) {
        LocalDate today = LocalDate.now();

        // 1. Validate không lập kế hoạch cho quá khứ
        PeriodResolver.validateNotPast(request, today);

        // 2. Tính planStartDate (DB key) và scheduleStartDate (ngày sinh lịch)
        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(request, today);
        LocalDate planStartDate      = resolved.planStartDate();
        LocalDate scheduleStartDate  = resolved.scheduleStartDate();

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Mặt hàng", request.getProductId()));

        WarehouseConfig config = resolveWarehouseConfig(request);

        // Resolve snapshot K, A, C, L
        SnapshotData snapshot = resolveSnapshot(request);

        // Tìm hoặc tạo InventoryParameter
        InventoryParameter param = parameterRepository
                .findByProductIdAndPlanStartDateAndPlanningUnit(
                        request.getProductId(), planStartDate, request.getPlanningUnit())
                .orElse(new InventoryParameter());

        param.setProduct(product);
        param.setWarehouseConfig(config);
        param.setPlanningUnit(request.getPlanningUnit());
        param.setPlanStartDate(planStartDate);           // ngày đầu kỳ — DB key
        param.setScheduleStartDate(scheduleStartDate);   // ngày sinh lịch — hôm nay hoặc đầu kỳ tương lai
        param.setDemandQ(request.getDemandQ());
        param.setStorageCostCoefficientI(
                normalizeI(request.getStorageCostCoefficientI(), request.getPlanningUnit()));

        // Ghi snapshot (đã quy đổi về đơn vị kỳ)
        param.setSupplierProductId(snapshot.supplierProductId);
        param.setSnapshotSupplyRateK(snapshot.supplyRateK);
        param.setSnapshotFixedOrderCostA(snapshot.fixedOrderCostA);
        param.setSnapshotUnitPriceC(snapshot.unitPriceC);
        param.setSnapshotLeadTimeL(snapshot.leadTimeL);
        param.setSupplierDataSource(snapshot.source);

        param = parameterRepository.save(param);

        // Tính toán
        InventoryCalculationResult calcResult = calculationService.calculate(param);

        // Lưu kết quả + sinh lịch
        saveResult(param, calcResult);
        generateOrderSchedule(param, calcResult);

        return calcResult;
    }

    /**
     * Lấy gợi ý Q tự động từ lịch sử tiêu thụ (AI forecast).
     * Kèm theo thông tin K, A, C, L từ Supplier Service để hiển thị preview.
     */
    public ForecastSuggestionResponse getSuggestion(Long productId, PlanningUnit planningUnit) {
        ForecastResult demandForecast = forecastOrchestrator.forecastDemand(productId, planningUnit);
        ForecastResult leadTimeForecast = forecastOrchestrator.forecastLeadTime(productId, planningUnit);

        // Thử lấy thông tin supplier để hiển thị cùng gợi ý
        Optional<SupplierProductData> supplierData = supplierServiceClient.getByProductId(productId);

        ForecastSuggestionResponse.ForecastSuggestionResponseBuilder builder =
                ForecastSuggestionResponse.builder()
                        .productId(productId)
                        .planningUnit(planningUnit)
                        .suggestedQ(demandForecast.getForecastValue() > 0
                                ? BigDecimal.valueOf(demandForecast.getForecastValue()) : null)
                        .demandForecast(demandForecast)
                        .leadTimeForecast(leadTimeForecast)
                        .requiresManualInput(demandForecast.isRequiresManualInput());

        supplierData.ifPresent(sp -> {
            builder.supplierName(sp.getSupplierName());
            builder.supplierProductId(sp.getId());
            // Quy đổi K về đơn vị kỳ để hiển thị
            builder.currentSupplyRateK(convertKToPlanningUnit(sp.getMaxSupplyPerMonth(), planningUnit));
            builder.currentFixedOrderCostA(sp.getFixedOrderCost());
            builder.currentUnitPriceC(sp.getUnitPrice());
            builder.currentLeadTimeDays(sp.getCommittedLeadTimeDays());
        });

        return builder.build();
    }

    // -------------------------------------------------------
    // ORDER SCHEDULE — dùng scheduleStartDate thay vì planStartDate
    // -------------------------------------------------------

    private void generateOrderSchedule(InventoryParameter param, InventoryCalculationResult result) {
        InventoryResult savedResult = resultRepository
                .findByInventoryParameterId(param.getId()).orElseThrow();

        scheduleRepository.deleteByInventoryResultId(savedResult.getId());

        // Sinh lịch từ scheduleStartDate (hôm nay hoặc đầu kỳ tương lai)
        // Kết thúc tại cuối kỳ kế hoạch tính từ planStartDate
        LocalDate scheduleStart = param.getScheduleStartDate();
        LocalDate planEnd       = getPlanEndDate(param.getPlanStartDate(), param.getPlanningUnit());

        List<OrderSchedule> schedules = new ArrayList<>();
        int sequence = 1;
        LocalDate orderDate = scheduleStart;

        while (!orderDate.isAfter(planEnd)) {
            long leadTimeDays = convertToDays(param.getSnapshotLeadTimeL(), param.getPlanningUnit());
            LocalDate deliveryDate = orderDate.plusDays(leadTimeDays);

            BigDecimal estimatedCost = param.getSnapshotFixedOrderCostA()
                    .add(param.getSnapshotUnitPriceC().multiply(result.getOptimalOrderQtyS()));

            schedules.add(OrderSchedule.builder()
                    .inventoryResult(savedResult)
                    .product(param.getProduct())
                    .orderSequence(sequence++)
                    .orderDate(orderDate)
                    .expectedDeliveryDate(deliveryDate)
                    .orderQuantity(result.getOptimalOrderQtyS())
                    .estimatedCost(estimatedCost)
                    .build());

            long cycleDays = convertToDays(result.getOptimalCycleTimeTau(), param.getPlanningUnit());
            if (cycleDays <= 0) break;
            orderDate = orderDate.plusDays(cycleDays);
        }

        scheduleRepository.saveAll(schedules);
    }

    // -------------------------------------------------------
    // SNAPSHOT RESOLUTION
    // -------------------------------------------------------

    /**
     * Resolve K, A, C, L theo thứ tự ưu tiên:
     *   1. Supplier Service (REST call)
     *   2. Kỳ kế hoạch gần nhất của cùng sản phẩm (fallback)
     *   3. Manual từ request
     */
    private SnapshotData resolveSnapshot(InventoryParameterRequest request) {
        PlanningUnit unit = request.getPlanningUnit();

        // Bước 1: Gọi Supplier Service
        Optional<SupplierProductData> supplierOpt =
                supplierServiceClient.getByProductId(request.getProductId());

        if (supplierOpt.isPresent()) {
            SupplierProductData sp = supplierOpt.get();
            log.info("Dùng SUPPLIER_SERVICE cho productId={}", request.getProductId());
            return SnapshotData.builder()
                    .supplierProductId(UUID.fromString(sp.getId()))
                    .supplyRateK(convertKToPlanningUnit(sp.getMaxSupplyPerMonth(), unit))
                    .fixedOrderCostA(sp.getFixedOrderCost())
                    .unitPriceC(sp.getUnitPrice())
                    .leadTimeL(convertLeadTimeToPlanningUnit(sp.getCommittedLeadTimeDays(), unit))
                    .source("SUPPLIER_SERVICE")
                    .build();
        }

        Optional<InventoryParameter> previousOpt = parameterRepository
                .findTopByProductIdAndPlanningUnitOrderByPlanStartDateDesc(
                        request.getProductId(), unit);

        if (previousOpt.isPresent()) {
            InventoryParameter prev = previousOpt.get();
            log.warn("Dùng PREVIOUS_PERIOD cho productId={}, kỳ={}",
                    request.getProductId(), prev.getPlanStartDate());
            return SnapshotData.builder()
                    .supplierProductId(prev.getSupplierProductId())
                    .supplyRateK(prev.getSnapshotSupplyRateK())
                    .fixedOrderCostA(prev.getSnapshotFixedOrderCostA())
                    .unitPriceC(prev.getSnapshotUnitPriceC())
                    .leadTimeL(prev.getSnapshotLeadTimeL())
                    .source("PREVIOUS_PERIOD")
                    .build();
        }

        if (request.getManualSupplyRateK() != null
                && request.getManualFixedOrderCostA() != null
                && request.getManualUnitPriceC() != null
                && request.getManualLeadTimeDays() != null) {
            log.warn("Dùng MANUAL cho productId={}", request.getProductId());
            return SnapshotData.builder()
                    .supplierProductId(null)
                    .supplyRateK(request.getManualSupplyRateK())
                    .fixedOrderCostA(request.getManualFixedOrderCostA())
                    .unitPriceC(request.getManualUnitPriceC())
                    .leadTimeL(convertLeadTimeToPlanningUnit(
                            request.getManualLeadTimeDays().intValue(), unit))
                    .source("MANUAL")
                    .build();
        }

        throw new IllegalStateException(
                "Không thể lấy K, A, C, L cho sản phẩm id=" + request.getProductId()
                        + ". Supplier Service không phản hồi, không có kỳ trước, không có manual.");
    }

    // -------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------

    /** K nhập theo tháng → quy đổi về đơn vị kỳ */
    private BigDecimal convertKToPlanningUnit(BigDecimal kPerMonth, PlanningUnit unit) {
        return switch (unit) {
            case MONTH   -> kPerMonth;
            case QUARTER -> kPerMonth.multiply(BigDecimal.valueOf(3));
            case YEAR    -> kPerMonth.multiply(BigDecimal.valueOf(12));
        };
    }

    /** L (ngày) → quy đổi về đơn vị kỳ (phần thập phân) */
    private BigDecimal convertLeadTimeToPlanningUnit(int days, PlanningUnit unit) {
        double divisor = switch (unit) {
            case MONTH   -> 30.0;
            case QUARTER -> 90.0;
            case YEAR    -> 365.0;
        };
        return BigDecimal.valueOf(days / divisor).setScale(4, RoundingMode.HALF_UP);
    }

    /** L (đơn vị kỳ) → ngày nguyên để tính lịch */
    private long convertToDays(BigDecimal value, PlanningUnit unit) {
        double days = switch (unit) {
            case MONTH   -> value.doubleValue() * 30;
            case QUARTER -> value.doubleValue() * 90;
            case YEAR    -> value.doubleValue() * 365;
        };
        return Math.round(days);
    }

    /** I năm → I theo đơn vị kỳ */
    private BigDecimal normalizeI(BigDecimal iYearly, PlanningUnit unit) {
        return switch (unit) {
            case YEAR    -> iYearly;
            case QUARTER -> iYearly.divide(BigDecimal.valueOf(4), 6, RoundingMode.HALF_UP);
            case MONTH   -> iYearly.divide(BigDecimal.valueOf(12), 6, RoundingMode.HALF_UP);
        };
    }

    private LocalDate getPlanEndDate(LocalDate planStart, PlanningUnit unit) {
        return switch (unit) {
            case MONTH   -> planStart.plusMonths(1).minusDays(1);
            case QUARTER -> planStart.plusMonths(3).minusDays(1);
            case YEAR    -> planStart.plusYears(1).minusDays(1);
        };
    }

    // -------------------------------------------------------
    // INTERNAL HELPERS
    // -------------------------------------------------------

    private WarehouseConfig resolveWarehouseConfig(InventoryParameterRequest request) {
        if (request.getWarehouseConfigId() != null) {
            return warehouseConfigRepository.findById(request.getWarehouseConfigId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Cấu hình kho", request.getWarehouseConfigId()));
        }
        return warehouseConfigRepository.findByIsDefaultTrue().orElse(null);
    }

    private void saveResult(InventoryParameter param, InventoryCalculationResult calc) {
        InventoryResult result = resultRepository
                .findByInventoryParameterId(param.getId())
                .orElse(InventoryResult.builder().inventoryParameter(param).build());

        result.setOptimalOrderQtyS(calc.getOptimalOrderQtyS());
        result.setOptimalOrderCountN(calc.getOptimalOrderCountN());
        result.setOptimalCycleTimeTau(calc.getOptimalCycleTimeTau());
        result.setMaxInventoryLevel(calc.getMaxInventoryLevel());
        result.setAvgInventoryLevel(calc.getAvgInventoryLevel());
        result.setReorderPointB(calc.getReorderPointB());
        result.setMinTotalCost(calc.getMinTotalCost());
        result.setTotalCostWithPurchase(calc.getTotalCostWithPurchase());
        result.setReplenishmentTimeTn(calc.getReplenishmentTimeTn());
        result.setMValue(calc.getMValue());

        resultRepository.save(result);
    }

    // -------------------------------------------------------
    // INNER CLASS: snapshot data holder
    // -------------------------------------------------------
    @lombok.Builder
    @lombok.Data
    private static class SnapshotData {
        UUID supplierProductId;
        BigDecimal supplyRateK;
        BigDecimal fixedOrderCostA;
        BigDecimal unitPriceC;
        BigDecimal leadTimeL;
        String source;
    }
}