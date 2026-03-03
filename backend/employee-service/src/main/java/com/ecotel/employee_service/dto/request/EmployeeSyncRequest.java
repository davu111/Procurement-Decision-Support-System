package com.ecotel.employee_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeSyncRequest {
    String siteId;
    String positionId;
    String departmentId;
    Boolean ppeCompliantFlag;
    Boolean inWarehouseFlag;
    String status;
}
