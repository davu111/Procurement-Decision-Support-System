package com.ecotel.employee_service.mapper;

import com.ecotel.employee_service.dto.request.RoleRequest;
import com.ecotel.employee_service.dto.request.RoleUpdateRequest;
import com.ecotel.employee_service.dto.response.RoleResponse;
import com.ecotel.employee_service.model.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    /**
     * Map RoleRequest to Role entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    Role toEntity(RoleRequest request);

    /**
     * Map Role entity to RoleResponse
     */
    RoleResponse toResponse(Role role);

    /**
     * Update Role entity from RoleRequest
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromRequest(RoleRequest request, @MappingTarget Role role);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromUpdateRequest(RoleUpdateRequest request, @MappingTarget Role role);
}
