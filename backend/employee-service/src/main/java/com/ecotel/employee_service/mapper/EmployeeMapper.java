package com.ecotel.employee_service.mapper;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.model.Department;
import com.ecotel.employee_service.model.Employee;
import com.ecotel.employee_service.model.Position;
import com.ecotel.employee_service.model.Role;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    /**
     * Map EmployeeRequest to Employee entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(source = "role", target = "role")
    @Mapping(source = "position", target = "position")
    @Mapping(source = "department", target = "department")
    Employee toEntity(EmployeeRequest request, Role role, Position position, Department department);

    /**
     * Map Employee entity to EmployeeResponse
     */
    @Mapping(source = "role.id", target = "roleId")
    @Mapping(source = "role.roleName", target = "roleName")
    @Mapping(source = "position.id", target = "positionId")
    @Mapping(source = "position.positionName", target = "positionName")
    @Mapping(source = "department.id", target = "departmentId")
    @Mapping(source = "department.departmentName", target = "departmentName")
    EmployeeResponse toResponse(Employee employee);

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "role", target = "role")
    @Mapping(source = "position", target = "position")
    @Mapping(source = "department", target = "department")
    void updateEntityFromRequest(EmployeeRequest request, @MappingTarget Employee employee, Role role, Position position, Department department);
}
