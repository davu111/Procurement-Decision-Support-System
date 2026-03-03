package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.ProcessingResult;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.enums.ProcessingStatus;
import com.ecotel.camera_service.service.ExternalServiceClient;
import com.ecotel.camera_service.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeInfoProcessor implements EventProcessor {
    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;

    @Override
    public ProcessingResult<Object> process(String cameraId, CameraEventRequest request){
        ProcessingResult<Object> result = new ProcessingResult<>();
        try {
            String idCard = request.getIdentifier();
            log.info("Processing employee info: {} from camera: {}",
                    idCard, cameraId);
            // Call employee-service to get employee info
            Object employeeInfo = externalServiceClient.getEmployeeInfo(idCard);
            System.out.println("Employee info: " + employeeInfo);
            if (employeeInfo == null) {
                result.setSuccess(false);
                result.setStatus(ProcessingStatus.INVALID);
                result.setMessage("Employee not found with id card: " + idCard);
                return result;
            }
            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(employeeInfo);
            result.setMessage("Vehicle info retrieved successfully");

            // PUSH real-time notification to frontend
            webSocketService.broadcastEmployeeInfo(
                    cameraId, idCard, employeeInfo, result.getStatus());

            // FUTURE EXTENSION: Additional processing
            // TODO: Có thể thêm:

            return result;

        } catch (Exception e) {
            log.error("Error processing employee info: {}", e.getMessage());
            throw new RuntimeException("Failed to process employee info", e);
        }
    }

    @Override
    public boolean supports(String eventType) {
        return EventType.EMPLOYEE_IDENTIFICATION.name().equals(eventType);
    }
}


