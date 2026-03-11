package com.ecotel.supplier_service.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupplierResponse {
    private String id;
    private String supplierCode;
    private String supplierName;
    private String address;
    private String contactPerson;
    private String phone;
    private String email;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
