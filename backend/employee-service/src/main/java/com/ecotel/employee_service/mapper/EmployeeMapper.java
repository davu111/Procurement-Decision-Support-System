package com.ecotel.employee_service.mapper;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.model.Employee;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    /**
     * Map EmployeeRequest to Employee entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(source = "roleName", target = "roleName")
    Employee toEntity(EmployeeRequest request);

    /**
     * Map Employee entity to EmployeeResponse
     */
    @Mapping(source = "roleName", target = "roleName")
    EmployeeResponse toResponse(Employee employee);

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "roleName", target = "roleName")
    void updateEntityFromRequest(EmployeeRequest request, @MappingTarget Employee employee);
}
