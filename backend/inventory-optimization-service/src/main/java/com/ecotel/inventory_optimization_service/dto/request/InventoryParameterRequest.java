package com.ecotel.inventory_optimization_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryParameterRequest {

    @NotNull(message = "Mã mặt hàng không được trống")
    private String productId;

    private Long warehouseConfigId;

    /**
     * Tháng bắt đầu kế hoạch (1–12).
     * Không cần planningUnit nữa — tất cả đều là tháng.
     */
    @NotNull(message = "Tháng bắt đầu không được trống")
    @Min(value = 1) @Max(value = 12)
    private Integer startMonth;

    @NotNull(message = "Tháng kết thúc không được trống")
    @Min(value = 1) @Max(value = 12)
    private Integer endMonth;

    @NotNull(message = "Năm kế hoạch không được trống")
    @Min(value = 2020)
    private Integer year;

    /**
     * Q — nhu cầu tiêu thụ MỖI THÁNG.
     * Thuật toán chạy với Q này, lịch đặt hàng sinh xuyên suốt từ startMonth đến endMonth.
     */
    @NotNull(message = "Nhu cầu Q không được trống")
    @DecimalMin(value = "0.0001", message = "Q phải > 0")
    private BigDecimal demandQ;

    /**
     * I — hệ số bảo quản theo NĂM.
     * Service tự quy đổi về tháng (I/12).
     */
    @NotNull(message = "Hệ số bảo quản I không được trống")
    @DecimalMin(value = "0.0001") @DecimalMax(value = "1.0")
    private BigDecimal storageCostCoefficientI;

    /**
     * Tồn kho thực tế (hoặc dự đoán) tại ngày bắt đầu kế hoạch.
     * - null → kế hoạch đầu tiên, hệ thống dùng B lý thuyết làm điểm xuất phát
     * - có giá trị → replan, hệ thống tính ngày đặt hàng đầu tiên từ giá trị này
     */
    private BigDecimal initialInventory;

    /**
     * Lô hàng đang bay: số lượng đã đặt nhưng chưa nhận tại ngày bắt đầu.
     * Chỉ điền khi replan và có đơn hàng đang vận chuyển.
     */
    private BigDecimal scheduledReceiptQty;

    /**
     * Ngày nhận lô hàng đang bay.
     */
    private java.time.LocalDate scheduledReceiptDate;

    // Fallback manual
    private BigDecimal manualSupplyRateK;
    private BigDecimal manualFixedOrderCostA;
    private BigDecimal manualUnitPriceC;
    private BigDecimal manualLeadTimeDays;
}