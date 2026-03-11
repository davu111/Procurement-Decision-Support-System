package com.ecotel.supplier_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierRequest {

    @NotBlank(message = "Mã NCC không được trống")
    @Size(max = 50)
    private String supplierCode;

    @NotBlank(message = "Tên NCC không được trống")
    @Size(max = 200)
    private String supplierName;

    @Size(max = 500)
    private String address;

    @Size(max = 100)
    private String contactPerson;

    @Size(max = 20)
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100)
    private String email;
}
