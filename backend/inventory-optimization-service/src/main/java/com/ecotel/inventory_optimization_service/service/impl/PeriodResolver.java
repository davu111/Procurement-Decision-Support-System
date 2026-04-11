package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import lombok.experimental.UtilityClass;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Tính planStartDate, planEndDate, scheduleStartDate từ startMonth/endMonth/year.
 *
 * planStartDate    = ngày 1 của startMonth  → DB key
 * planEndDate      = ngày cuối của endMonth → giới hạn sinh lịch
 * scheduleStartDate:
 *   startMonth == tháng hiện tại → hôm nay
 *   startMonth > tháng hiện tại  → planStartDate
 */
@UtilityClass
public class PeriodResolver {

    public record ResolvedPeriod(
            LocalDate planStartDate,
            LocalDate planEndDate,
            LocalDate scheduleStartDate
    ) {}

    public ResolvedPeriod resolve(InventoryParameterRequest request, LocalDate today, String mode) {
        validate(request, today, mode);

        LocalDate planStartDate = LocalDate.of(request.getYear(), request.getStartMonth(), 1);
        LocalDate planEndDate   = YearMonth.of(request.getYear(), request.getEndMonth()).atEndOfMonth();

        // Nếu startMonth là tháng hiện tại → bắt đầu lịch từ hôm nay
        LocalDate currentMonthStart = today.withDayOfMonth(1);
        LocalDate scheduleStartDate = planStartDate.isEqual(currentMonthStart)
                ? today
                : planStartDate;

        return new ResolvedPeriod(planStartDate, planEndDate, scheduleStartDate);
    }

    /**
     * Validate đầu vào:
     *   1. startMonth <= endMonth (trong cùng năm)
     *   2. Không lập kế hoạch cho quá khứ (startMonth < tháng hiện tại)
     */
    public void validate(InventoryParameterRequest request, LocalDate today, String mode) {
        int startMonth = request.getStartMonth();
        int endMonth   = request.getEndMonth();
        int year       = request.getYear();

        if (startMonth > endMonth) {
            throw new IllegalArgumentException(
                    "Tháng bắt đầu (" + startMonth + ") không thể lớn hơn tháng kết thúc (" + endMonth + ")");
        }

        // Kỳ bắt đầu không được trong quá khứ
        LocalDate planStartDate      = LocalDate.of(year, startMonth, 1);
        LocalDate currentMonthStart  = today.withDayOfMonth(1);

        if (mode == null && planStartDate.isBefore(currentMonthStart)) {
            throw new IllegalArgumentException(
                    "Không thể lập kế hoạch cho tháng " + startMonth + "/" + year
                            + " — tháng này đã qua");
        }
    }

    /**
     * Tính label hiển thị cho kỳ kế hoạch.
     * Vd: "Tháng 1–5/2025" hoặc "Tháng 3/2025" nếu chỉ 1 tháng.
     */
    public String formatLabel(InventoryParameterRequest request) {
        int start = request.getStartMonth();
        int end   = request.getEndMonth();
        int year  = request.getYear();
        if (start == end) return "Tháng " + start + "/" + year;
        return "Tháng " + start + "–" + end + "/" + year;
    }
}