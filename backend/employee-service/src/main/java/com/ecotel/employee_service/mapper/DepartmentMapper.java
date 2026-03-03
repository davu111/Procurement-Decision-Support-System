package com.ecotel.employee_service.mapper;

import com.ecotel.employee_service.dto.request.DepartmentRequest;
import com.ecotel.employee_service.dto.request.DepartmentUpdateRequest;
import com.ecotel.employee_service.dto.response.DepartmentResponse;
import com.ecotel.employee_service.model.Department;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {

    /**
     * Map DepartmentRequest to Department entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    Department toEntity(DepartmentRequest request);

    /**
     * Map Department entity to DepartmentResponse
     */
    DepartmentResponse toResponse(Department department);

    /**
     * Update Department entity from DepartmentRequest
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromRequest(DepartmentRequest request, @MappingTarget Department department);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromUpdateRequest(DepartmentUpdateRequest departmentRequest, @MappingTarget Department department);
}
