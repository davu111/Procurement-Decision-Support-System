package com.ecotel.employee_service.dto.request;

import com.ecotel.employee_service.enums.EmployeeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeUpdateRequest {
    String id;
    String firstName;
    String lastName;
    String username;
    String roleName;
    EmployeeStatus status;
}
