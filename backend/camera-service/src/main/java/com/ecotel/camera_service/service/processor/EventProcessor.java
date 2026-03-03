package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.ProcessingResult;
import com.ecotel.camera_service.dto.response.VehiclePlanResult;

public interface EventProcessor {
    ProcessingResult<?> process(String cameraId, CameraEventRequest request);
    boolean supports(String eventType);
}
