package com.ecotel.inventory_optimization_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WarehouseConfigRequest {

    @NotBlank(message = "Tên cấu hình không được trống")
    private String configName;

    @NotNull @DecimalMin("0")
    private BigDecimal interestRate;        // lãi suất/năm, ví dụ: 0.08

    @NotNull @DecimalMin("0")
    private BigDecimal warehouseMonthlyCost; // chi phí kho/tháng

    @NotNull @DecimalMin("0.0001")
    private BigDecimal warehouseMaxCapacity; // sức chứa tối đa

    @NotNull @DecimalMin("0")
    private BigDecimal spoilageRate;         // tỉ lệ hao hụt/năm, ví dụ: 0.02

    @NotNull @DecimalMin("0")
    private BigDecimal insuranceRate;        // bảo hiểm/năm, ví dụ: 0.005

    private Boolean isDefault;

    // Đơn giá trung bình để tính warehouseCostRate
    // Nếu null → hệ thống dùng trung bình đơn giá tất cả sản phẩm
    private BigDecimal avgUnitPriceForCalculation;
}
