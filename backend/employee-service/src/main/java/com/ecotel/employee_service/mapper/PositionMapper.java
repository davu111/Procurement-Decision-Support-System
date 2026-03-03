package com.ecotel.employee_service.mapper;

import com.ecotel.employee_service.dto.request.PositionRequest;
import com.ecotel.employee_service.dto.request.PositionUpdateRequest;
import com.ecotel.employee_service.dto.response.PositionResponse;
import com.ecotel.employee_service.model.Position;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PositionMapper {

    /**
     * Map PositionRequest to Position entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    Position toEntity(PositionRequest request);

    /**
     * Map Position entity to PositionResponse
     */
    PositionResponse toResponse(Position position);

    /**
     * Update Position entity from PositionRequest
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromRequest(PositionRequest request, @MappingTarget Position position);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employees", ignore = true)
    void updateEntityFromUpdateRequest(PositionUpdateRequest request, @MappingTarget Position position);
}
