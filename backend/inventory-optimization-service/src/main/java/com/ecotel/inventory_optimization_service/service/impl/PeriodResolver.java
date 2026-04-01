package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import lombok.experimental.UtilityClass;

import java.time.LocalDate;
import java.time.Month;

/**
 * Tính planStartDate và scheduleStartDate từ targetPeriod + targetYear.
 *
 * planStartDate  = ngày đầu tiên của kỳ được chọn → dùng làm DB key
 * scheduleStartDate = ngày bắt đầu sinh lịch đặt hàng:
 *   - Nếu kỳ được chọn là kỳ hiện tại → ngày hôm nay
 *   - Nếu kỳ được chọn là kỳ tương lai → ngày đầu tiên của kỳ đó
 */
@UtilityClass
public class PeriodResolver {

    public record ResolvedPeriod(LocalDate planStartDate, LocalDate scheduleStartDate) {}

    public ResolvedPeriod resolve(InventoryParameterRequest request, LocalDate today) {
        PlanningUnit unit = request.getPlanningUnit();
        int period = request.getTargetPeriod();
        int year   = request.getTargetYear();

        LocalDate planStartDate     = toPlanStartDate(unit, period, year);
        LocalDate currentPeriodStart = currentPeriodStart(unit, today);

        // Nếu kỳ được chọn là kỳ hiện tại → bắt đầu lịch từ hôm nay
        // Nếu là kỳ tương lai → bắt đầu từ ngày đầu của kỳ đó
        LocalDate scheduleStartDate = planStartDate.isEqual(currentPeriodStart)
                ? today
                : planStartDate;

        return new ResolvedPeriod(planStartDate, scheduleStartDate);
    }

    /**
     * Validate: không cho lập kế hoạch cho kỳ đã qua.
     * Ném IllegalArgumentException nếu targetPeriod < kỳ hiện tại.
     */
    public void validateNotPast(InventoryParameterRequest request, LocalDate today) {
        PlanningUnit unit = request.getPlanningUnit();
        int period = request.getTargetPeriod();
        int year   = request.getTargetYear();

        LocalDate planStartDate      = toPlanStartDate(unit, period, year);
        LocalDate currentPeriodStart = currentPeriodStart(unit, today);

        if (planStartDate.isBefore(currentPeriodStart)) {
            String periodLabel = formatPeriodLabel(unit, period, year);
            throw new IllegalArgumentException(
                    "Không thể lập kế hoạch cho kỳ đã qua: " + periodLabel);
        }
    }

    // -------------------------------------------------------
    // Tính ngày đầu tiên của kỳ được chọn (dùng làm DB key)
    // -------------------------------------------------------
    public LocalDate toPlanStartDate(PlanningUnit unit, int period, int year) {
        return switch (unit) {
            case MONTH   -> LocalDate.of(year, period, 1);
            case QUARTER -> LocalDate.of(year, (period - 1) * 3 + 1, 1);
            case YEAR    -> LocalDate.of(year, Month.JANUARY, 1);
        };
    }

    // -------------------------------------------------------
    // Tính ngày đầu tiên của kỳ HIỆN TẠI (làm ngưỡng chặn)
    // -------------------------------------------------------
    private LocalDate currentPeriodStart(PlanningUnit unit, LocalDate today) {
        return switch (unit) {
            case MONTH   -> today.withDayOfMonth(1);
            case QUARTER -> {
                int currentQuarter = (today.getMonthValue() - 1) / 3 + 1;
                yield LocalDate.of(today.getYear(), (currentQuarter - 1) * 3 + 1, 1);
            }
            case YEAR    -> LocalDate.of(today.getYear(), Month.JANUARY, 1);
        };
    }

    private String formatPeriodLabel(PlanningUnit unit, int period, int year) {
        return switch (unit) {
            case MONTH   -> "Tháng " + period + "/" + year;
            case QUARTER -> "Q" + period + "/" + year;
            case YEAR    -> "Năm " + year;
        };
    }
}