package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.response.ForecastResult;
import com.ecotel.inventory_optimization_service.dto.response.ForecastSuggestionResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.mapper.InventoryPlanningMapper;
import com.ecotel.inventory_optimization_service.model.*;
import com.ecotel.inventory_optimization_service.repository.*;
import com.ecotel.inventory_optimization_service.service.InventoryCalculationService;
import com.ecotel.inventory_optimization_service.service.forecast.ForecastOrchestrator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Tạo hoặc cập nhật tham số và tính toán kết quả tối ưu
     */
    @Transactional
    public InventoryCalculationResult createAndCalculate(InventoryParameterRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Mặt hàng", request.getProductId()));

        WarehouseConfig config = resolveWarehouseConfig(request);

        // Kiểm tra đã tồn tại chưa
        InventoryParameter param = parameterRepository
                .findByProductIdAndPlanStartDateAndPlanningUnit(
                        request.getProductId(), request.getPlanStartDate(), request.getPlanningUnit())
                .orElse(new InventoryParameter());

        // Map request → entity
        param.setProduct(product);
        param.setWarehouseConfig(config);
        param.setPlanningUnit(request.getPlanningUnit());
        param.setPlanStartDate(request.getPlanStartDate());
        param.setDemandQ(request.getDemandQ());
        param.setSupplyRateK(request.getSupplyRateK());
        param.setFixedOrderCostA(request.getFixedOrderCostA());
        param.setStorageCostCoefficientI(normalizeI(request.getStorageCostCoefficientI(), request.getPlanningUnit()));
        param.setLeadTimeL(request.getLeadTimeL());

        param = parameterRepository.save(param);

        // Tính toán
        InventoryCalculationResult calcResult = calculationService.calculate(param);

        // Lưu kết quả
        saveResult(param, calcResult);

        // Sinh lịch kế hoạch
        generateOrderSchedule(param, calcResult);

        return calcResult;
    }

    /**
     * Lấy gợi ý tham số tự động từ lịch sử
     */
    public ForecastSuggestionResponse getSuggestion(Long productId, PlanningUnit planningUnit) {
        ForecastResult demandForecast = forecastOrchestrator.forecastDemand(productId, planningUnit);
        ForecastResult leadTimeForecast = forecastOrchestrator.forecastLeadTime(productId, planningUnit);

        return ForecastSuggestionResponse.builder()
                .productId(productId)
                .planningUnit(planningUnit)
                .suggestedQ(demandForecast.getForecastValue() > 0
                        ? BigDecimal.valueOf(demandForecast.getForecastValue())
                        : null)
                .suggestedL(leadTimeForecast.getForecastValue() > 0
                        ? BigDecimal.valueOf(leadTimeForecast.getForecastValue())
                        : null)
                .demandForecast(demandForecast)
                .leadTimeForecast(leadTimeForecast)
                .requiresManualInput(demandForecast.isRequiresManualInput())
                .build();
    }

    /**
     * Sinh lịch đặt hàng tự động dựa trên kết quả tối ưu
     */
    private void generateOrderSchedule(InventoryParameter param, InventoryCalculationResult result) {
        InventoryResult savedResult = resultRepository
                .findByInventoryParameterId(param.getId())
                .orElseThrow();

        // Xóa lịch cũ nếu có
        scheduleRepository.deleteByInventoryResultId(savedResult.getId());

        LocalDate startDate = param.getPlanStartDate();
        LocalDate endDate = getPlanEndDate(startDate, param.getPlanningUnit());

        List<OrderSchedule> schedules = new ArrayList<>();
        int sequence = 1;
        LocalDate orderDate = startDate;

        while (!orderDate.isAfter(endDate)) {
            // Lead time tính bằng ngày
            long leadTimeDays = convertTodays(param.getLeadTimeL(), param.getPlanningUnit());
            LocalDate deliveryDate = orderDate.plusDays(leadTimeDays);

            BigDecimal estimatedCost = param.getFixedOrderCostA()
                    .add(param.getProduct().getUnitPrice().multiply(result.getOptimalOrderQtyS()));

            schedules.add(OrderSchedule.builder()
                    .inventoryResult(savedResult)
                    .product(param.getProduct())
                    .orderSequence(sequence++)
                    .orderDate(orderDate)
                    .expectedDeliveryDate(deliveryDate)
                    .orderQuantity(result.getOptimalOrderQtyS())
                    .estimatedCost(estimatedCost)
                    .build());

            // Bước đến lần đặt hàng tiếp theo
            long cycleDays = convertTodays(result.getOptimalCycleTimeTau(), param.getPlanningUnit());
            if (cycleDays <= 0) break;
            orderDate = orderDate.plusDays(cycleDays);
        }

        scheduleRepository.saveAll(schedules);
    }

    /**
     * Quy đổi hệ số I về đơn vị kỳ kế hoạch
     * I_năm → I_tháng = I_năm / 12
     */
    private BigDecimal normalizeI(BigDecimal iYearly, PlanningUnit unit) {
        return switch (unit) {
            case YEAR -> iYearly;
            case QUARTER -> iYearly.divide(BigDecimal.valueOf(4), 6, java.math.RoundingMode.HALF_UP);
            case MONTH -> iYearly.divide(BigDecimal.valueOf(12), 6, java.math.RoundingMode.HALF_UP);
        };
    }

    private LocalDate getPlanEndDate(LocalDate start, PlanningUnit unit) {
        return switch (unit) {
            case MONTH -> start.plusMonths(1).minusDays(1);
            case QUARTER -> start.plusMonths(3).minusDays(1);
            case YEAR -> start.plusYears(1).minusDays(1);
        };
    }

    private long convertTodays(BigDecimal value, PlanningUnit unit) {
        double days = switch (unit) {
            case MONTH -> value.doubleValue() * 30;
            case QUARTER -> value.doubleValue() * 90;
            case YEAR -> value.doubleValue() * 365;
        };
        return Math.round(days);
    }

    private WarehouseConfig resolveWarehouseConfig(InventoryParameterRequest request) {
        if (request.getWarehouseConfigId() != null) {
            return warehouseConfigRepository.findById(request.getWarehouseConfigId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cấu hình kho", request.getWarehouseConfigId()));
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
}
