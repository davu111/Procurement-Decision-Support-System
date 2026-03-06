package com.ecotel.inventory_optimization_service.dto.request;

import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    @NotNull(message = "Ngày bắt đầu kỳ không được trống")
    private LocalDate planStartDate;

    @NotNull(message = "Nhu cầu Q không được trống")
    @DecimalMin(value = "0.0001", message = "Q phải > 0")
    private BigDecimal demandQ;

    @NotNull(message = "Tốc độ bổ sung K không được trống")
    @DecimalMin(value = "0.0001", message = "K phải > 0")
    private BigDecimal supplyRateK;

    @NotNull(message = "Chi phí đặt hàng A không được trống")
    @DecimalMin(value = "0.0001", message = "A phải > 0")
    private BigDecimal fixedOrderCostA;

    @NotNull(message = "Hệ số bảo quản I không được trống")
    @DecimalMin(value = "0.0001", message = "I phải > 0")
    @DecimalMax(value = "1.0", message = "I phải <= 1 (100%)")
    private BigDecimal storageCostCoefficientI;

    @NotNull(message = "Lead time L không được trống")
    @DecimalMin(value = "0", message = "L phải >= 0")
    private BigDecimal leadTimeL;
}
