package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.ProcessingResult;
import com.ecotel.camera_service.dto.response.SafeEquipmentResult;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.enums.ProcessingStatus;
import com.ecotel.camera_service.service.ExternalServiceClient;
import com.ecotel.camera_service.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SafetyEquipmentProcessor implements EventProcessor {

    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;

    public ProcessingResult<Object> process(String cameraId, CameraEventRequest request) {
        ProcessingResult<Object> result = new ProcessingResult<Object>();

        try {
            String employeeId = request.getIdentifier();

            log.info("Processing safety equipment check: {} from camera: {}",
                    employeeId, cameraId);

            // Prepare status update
            Map<String, Object> status = new HashMap<>();
            status.put("checkedAt", LocalDateTime.now());
            status.put("cameraId", cameraId);

            // Parse metadata for equipment details
            boolean hasViolation = false;
            if (request.getMetadata() != null) {
                Boolean helmet = (Boolean) request.getMetadata().get("helmet");
                Boolean gloves = (Boolean) request.getMetadata().get("gloves");
                Boolean boots = (Boolean) request.getMetadata().get("boots");
                Boolean vest = (Boolean) request.getMetadata().get("vest");

                status.put("helmet", helmet);
                status.put("gloves", gloves);
                status.put("boots", boots);
                status.put("vest", vest);

                // Check for violations
                if (Boolean.FALSE.equals(helmet) ||
                        Boolean.FALSE.equals(gloves) ||
                        Boolean.FALSE.equals(boots) ||
                        Boolean.FALSE.equals(vest)) {
                    hasViolation = true;
                }
            }

            // Call employee-service to update status
//            Object updateResult = externalServiceClient
//                    .updateSafetyEquipmentStatus(employeeId, status);
//
//            if (updateResult == null) {
//                result.setSuccess(false);
//                result.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
//                result.setMessage("Failed to update employee status");
//                return result;
//            }

            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(status);
            result.setMessage("Safety equipment status updated successfully");

            // If violation detected, send alert immediately
            if (hasViolation) {
                Map<String, Object> violationDetails = new HashMap<>();
                violationDetails.put("employeeId", employeeId);
                violationDetails.put("equipmentStatus", status);
                violationDetails.put("severity", "HIGH");

                webSocketService.broadcastSafetyViolation(
                        cameraId, employeeId, violationDetails, result.getStatus());

                log.warn("Safety violation detected for employee: {}", employeeId);
            }

            // FUTURE EXTENSION: Additional processing
            // TODO: Có thể thêm:
            // - Gửi cảnh báo nếu thiếu bảo hộ
            // - Tự động chặn vào khu vực nguy hiểm
            // - Ghi nhận vi phạm an toàn
            // - Thống kê tuân thủ bảo hộ

            return result;

        } catch (Exception e) {
            log.error("Error processing safety equipment: {}", e.getMessage());
            result.setSuccess(false);
            result.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
            result.setMessage("Error: " + e.getMessage());
            return result;
        }
    }

    @Override
    public boolean supports(String eventType) {
        return EventType.SAFETY_EQUIPMENT_CHECK.name().equals(eventType);
    }
}