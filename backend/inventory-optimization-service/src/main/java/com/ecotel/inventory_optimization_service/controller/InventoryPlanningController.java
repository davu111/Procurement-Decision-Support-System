package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.response.*;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import com.ecotel.inventory_optimization_service.service.impl.InventoryPlanningService;
import com.ecotel.inventory_optimization_service.service.impl.PeriodResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryPlanningController {

    private final InventoryPlanningService planningService;
    private final OrderScheduleRepository  scheduleRepository;
    private final InventoryParameterRepository parameterRepository;

    /**
     * POST /api/inventory/calculate
     * Tạo kế hoạch mới. Báo lỗi nếu khoảng thời gian đã có kế hoạch (dùng /replan để thay thế).
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> calculate(
            @Valid @RequestBody InventoryParameterRequest request) {
        InventoryParameter previousParam = parameterRepository.findLatestActive(request.getProductId())
                .stream().findFirst().orElse(null);
        return ResponseEntity.ok(ApiResponse.success(
                planningService.createAndCalculate(request, previousParam),
                "Tính toán thành công. Lịch kế hoạch đã được tạo."));
    }

    /**
     * POST /api/inventory/replan
     * Thay thế kế hoạch cũ trong khoảng thời gian bằng kế hoạch mới.
     * Kế hoạch cũ bị đánh dấu SUPERSEDED (không xóa, giữ làm audit trail).
     *
     * Body bắt buộc có initialInventory (tồn kho tại ngày bắt đầu).
     * Có thể có scheduledReceiptQty + scheduledReceiptDate nếu có lô đang bay.
     */
    @PostMapping("/replan")
    public ResponseEntity<ApiResponse<InventoryCalculationResult>> replan(
            @Valid @RequestBody InventoryParameterRequest request) {
        if (request.getInitialInventory() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Replan yêu cầu initialInventory (tồn kho tại ngày bắt đầu kế hoạch mới)."));
        }
        return ResponseEntity.ok(ApiResponse.success(
                planningService.replan(request),
                "Replan thành công. Kế hoạch cũ đã được lưu lại làm lịch sử."));
    }

    /**
     * GET /api/inventory/predict-inventory/{productId}?targetDate=2025-05-01
     * Tính tồn kho dự đoán tại một ngày cụ thể từ kế hoạch đang ACTIVE.
     * Frontend gọi khi người dùng chọn ngày bắt đầu replan để pre-fill initialInventory.
     */
    @GetMapping("/predict-inventory/{productId}")
    public ResponseEntity<ApiResponse<PredictedInventoryResponse>> predictInventory(
            @PathVariable Long productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {
        return ResponseEntity.ok(ApiResponse.success(
                planningService.predictInventory(productId, targetDate)));
    }

    /**
     * POST /api/inventory/check-overlap
     * Kiểm tra trùng lặp trước khi tạo — frontend gọi để hiển thị confirm dialog.
     */
    @PostMapping("/check-overlap")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkOverlap(
            @Valid @RequestBody InventoryParameterRequest request) {
        List<InventoryParameter> overlapping = planningService.findOverlapping(request);
        if (overlapping.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(Map.of("hasOverlap", false)));
        }
        List<Map<String, Object>> detail = overlapping.stream()
                .map(p -> Map.<String, Object>of(
                        "id",      p.getId(),
                        "label",   "Tháng " + p.getPlanStartDate().getMonthValue()
                                + "–" + p.getPlanEndDate().getMonthValue()
                                + "/" + p.getPlanStartDate().getYear(),
                        "status",  p.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "hasOverlap",  true,
                "overlapping", detail)));
    }

    /**
     * DELETE /api/inventory/parameters/{id}
     * Xóa kế hoạch hoàn toàn (cascade xóa result + schedules).
     */
    @DeleteMapping("/parameters/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteParameter(@PathVariable Long id) {
        planningService.deleteParameter(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa kế hoạch"));
    }

    /**
     * GET /api/inventory/resolve-period?startMonth=1&endMonth=5&year=2025
     * Preview dates trước khi submit.
     */
    @GetMapping("/resolve-period")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolvePeriod(
            @RequestParam Integer startMonth,
            @RequestParam Integer endMonth,
            @RequestParam Integer year,
            @RequestParam (required = false) String mode) {
        InventoryParameterRequest temp = InventoryParameterRequest.builder()
                .startMonth(startMonth).endMonth(endMonth).year(year)
                .productId(0L).demandQ(BigDecimal.ONE).storageCostCoefficientI(BigDecimal.ONE)
                .build();
        try {
            PeriodResolver.validate(temp, LocalDate.now(), mode);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(temp, LocalDate.now(), mode);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "planStartDate",     resolved.planStartDate().toString(),
                "planEndDate",       resolved.planEndDate().toString(),
                "scheduleStartDate", resolved.scheduleStartDate().toString(),
                "isCurrentMonth",    resolved.scheduleStartDate().equals(LocalDate.now()),
                "label",             PeriodResolver.formatLabel(temp)
        )));
    }

    @GetMapping("/suggest/{productId}")
    public ResponseEntity<ApiResponse<ForecastSuggestionResponse>> getSuggestion(
            @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(planningService.getSuggestion(productId)));
    }

    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<?>>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                scheduleRepository.findByOrderDateBetween(from, to)));
    }

    @GetMapping("/schedule/{productId}")
    public ResponseEntity<ApiResponse<List<?>>> getScheduleByProduct(
            @PathVariable Long productId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                scheduleRepository.findByProductIdAndOrderDateBetween(productId, from, to)));
    }

    @GetMapping("/parameters/{id}")
    public ResponseEntity<ApiResponse<InventoryParameterResponse>> getParameterById(
            @PathVariable Long id,
            @RequestParam String yearMonth) {  // "2026-04"

        YearMonth ym = YearMonth.parse(yearMonth); // parse ISO format
        return ResponseEntity.ok(ApiResponse.success(
                planningService.getParameterRange(id, ym)));
    }
}
