package com.ecotel.inventory_optimization_service.dto.request;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryParameterRequest {

    @NotNull(message = "Mã mặt hàng không được trống")
    private Long productId;

    private Long warehouseConfigId; // null → dùng config mặc định

    @NotNull(message = "Đơn vị kỳ kế hoạch không được trống")
    private PlanningUnit planningUnit;

    /**
     * Kỳ kế hoạch cụ thể người dùng chọn — ý nghĩa tùy planningUnit:
     *   MONTH   → số tháng (1-12)
     *   QUARTER → số quý  (1-4)
     *   YEAR    → năm     (ví dụ 2025)
     *
     * Không nhận planStartDate trực tiếp từ client nữa.
     * planStartDate và scheduleStartDate được tính tự động trong service.
     */
    @NotNull(message = "Kỳ kế hoạch không được trống")
    @Min(value = 1, message = "Kỳ kế hoạch không hợp lệ")
    private Integer targetPeriod;

    /**
     * Năm của kỳ kế hoạch.
     * Với YEAR thì targetPeriod == targetYear, giữ riêng để rõ nghĩa.
     */
    @NotNull(message = "Năm kế hoạch không được trống")
    @Min(value = 2020, message = "Năm không hợp lệ")
    private Integer targetYear;

    @NotNull(message = "Nhu cầu Q không được trống")
    @DecimalMin(value = "0.0001", message = "Q phải > 0")
    private BigDecimal demandQ;

    @NotNull(message = "Hệ số bảo quản I không được trống")
    @DecimalMin(value = "0.0001", message = "I phải > 0")
    @DecimalMax(value = "1.0", message = "I phải <= 1 (100%)")
    private BigDecimal storageCostCoefficientI;

    // K, A, C, L không cần nhập - lấy tự động từ Supplier Service
    // Chỉ dùng khi fallback manual (Supplier Service down và không có kỳ trước)
    private BigDecimal manualSupplyRateK;
    private BigDecimal manualFixedOrderCostA;
    private BigDecimal manualUnitPriceC;
    private BigDecimal manualLeadTimeDays; // ngày - sẽ được quy đổi
}