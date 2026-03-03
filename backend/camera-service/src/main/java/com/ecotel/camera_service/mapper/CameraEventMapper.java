package com.ecotel.camera_service.mapper;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.model.CameraEvent;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CameraEventMapper {
    @Mapping(target = "metadata", ignore = true)
    CameraEventRequest toCameraEventRequest(CameraEvent cameraEvent);
    @Mapping(target = "metadata", ignore = true)
    CameraEvent toCameraEvent(CameraEventRequest cameraEventRequest);
}
