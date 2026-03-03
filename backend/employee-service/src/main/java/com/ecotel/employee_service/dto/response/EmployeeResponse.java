package com.ecotel.employee_service.dto.response;

import com.ecotel.employee_service.enums.EmployeeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeResponse {

    String id;
    String keycloakUserId;
    String idCard;
    String firstName;
    String lastName;
    String username;
    String siteId;
    String roleId;
    String roleName;
    String positionId;
    String positionName;
    String departmentId;
    String departmentName;
    Boolean ppeCompliantFlag;
    Boolean inWarehouseFlag;
    EmployeeStatus status;
}