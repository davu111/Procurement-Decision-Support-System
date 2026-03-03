package com.ecotel.camera_service.dto.response;

import com.ecotel.camera_service.enums.ProcessingStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CameraEventResponse {
    private Long eventId;
    private ProcessingStatus status;
    private String message;
    private Object result; // Dữ liệu trả về từ external service
    private LocalDateTime processedAt;

    public static CameraEventResponse success(Long eventId, Object data) {
        CameraEventResponse response = new CameraEventResponse();
        response.setEventId(eventId);
        response.setStatus(ProcessingStatus.SUCCESS);
        response.setResult(data);
        response.setProcessedAt(LocalDateTime.now());
        return response;
    }

    public static CameraEventResponse duplicate(String message) {
        CameraEventResponse response = new CameraEventResponse();
        response.setStatus(ProcessingStatus.DUPLICATE);
        response.setMessage(message);
        return response;
    }

    public static CameraEventResponse invalid(String message) {
        CameraEventResponse response = new CameraEventResponse();
        response.setStatus(ProcessingStatus.INVALID);
        response.setMessage(message);
        return response;
    }

    public static CameraEventResponse error(String message) {
        CameraEventResponse response = new CameraEventResponse();
        response.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
        response.setMessage(message);
        return response;
    }
}