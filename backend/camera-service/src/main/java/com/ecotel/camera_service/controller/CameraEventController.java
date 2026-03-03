package com.ecotel.camera_service.controller;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.ApiResponse;
import com.ecotel.camera_service.dto.response.CameraEventResponse;
import com.ecotel.camera_service.service.CameraEventService;
import com.ecotel.camera_service.service.ValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/camera/events")
@RequiredArgsConstructor
@Slf4j
public class CameraEventController {

    private final CameraEventService cameraEventService;
    private final ValidationService validationService;

    /**
     * Endpoint chính để nhận events từ camera
     */
    @PostMapping
    public ApiResponse<CameraEventResponse> receiveEvent(
            @RequestHeader("X-Camera-Id") String cameraId,
            @RequestHeader("X-Api-Key") String apiKey,
            @Valid @RequestBody CameraEventRequest request) {

        log.info("Received request from camera: {}", cameraId);

        // Validate camera credentials
        if (!validationService.validateCamera(cameraId, apiKey)) {
            return ApiResponse.<CameraEventResponse>builder()
                    .message("Invalid camera credentials")
                    .data(null)
                    .build();
        }

        // Process event
        CameraEventResponse response = cameraEventService.processEvent(
                cameraId, request);

        // Return appropriate status code
        HttpStatus status = switch (response.getStatus()) {
            case SUCCESS -> HttpStatus.OK;
            case DUPLICATE -> HttpStatus.OK; // Still 200, but marked as duplicate
            case INVALID, VALIDATION_FAILED -> HttpStatus.BAD_REQUEST;
            case EXTERNAL_SERVICE_ERROR -> HttpStatus.SERVICE_UNAVAILABLE;
            case FAILED -> HttpStatus.INTERNAL_SERVER_ERROR;
        };

        return ApiResponse.<CameraEventResponse>builder()
                .message("Event processed with status: " + response.getStatus())
                .data(response)
                .build();
    }

    @PostMapping("/test-event")
    public CameraEventResponse test(@RequestBody CameraEventRequest req) {
        return cameraEventService.processEvent("CAM-01", req);
    }


    // FUTURE EXTENSION: Additional endpoints
    /**
     * TODO: Có thể thêm:
     * - GET /events/{id}: Lấy chi tiết event
     * - GET /events: Query events với filters
     * - GET /cameras/{cameraId}/events: Events của camera cụ thể
     * - POST /events/{id}/retry: Retry failed event
     * - GET /statistics: Thống kê tổng quan
     */
}
