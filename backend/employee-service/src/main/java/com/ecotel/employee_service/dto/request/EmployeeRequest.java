package com.ecotel.employee_service.dto.request;

import com.ecotel.employee_service.enums.EmployeeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeRequest {
    String firstName;
    String lastName;
    String username;
    String idCard;
    String siteId;
    String roleId;
    String positionId;
    String departmentId;
    Boolean ppeCompliantFlag;
    Boolean inWarehouseFlag;
    EmployeeStatus status;
}
