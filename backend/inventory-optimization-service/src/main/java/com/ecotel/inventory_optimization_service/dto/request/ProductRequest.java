package com.ecotel.inventory_optimization_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Mã mặt hàng không được trống")
    @Size(max = 50, message = "Mã mặt hàng tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên mặt hàng không được trống")
    @Size(max = 200, message = "Tên mặt hàng tối đa 200 ký tự")
    private String name;

    @Size(max = 50, message = "Đơn vị tính tối đa 50 ký tự")
    private String unit;

    private String description;
}
