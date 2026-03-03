package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.VehiclePlanResult;
import com.ecotel.camera_service.dto.response.vehicle_plan.VehiclePlanResponse;
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
public class LicensePlateProcessor implements EventProcessor{

    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;

    public VehiclePlanResult process(String cameraId, CameraEventRequest request) {
        VehiclePlanResult result = new VehiclePlanResult();

        try {
            String licensePlate = request.getIdentifier();

            log.info("Processing license plate: {} from camera: {}",
                    licensePlate, cameraId);

            // Call vehicle-service to get vehicle info
            VehiclePlanResponse vehicleInfo = externalServiceClient.getVehiclePlan(licensePlate);
            System.out.println("Vehicle info: " + vehicleInfo);

            if (vehicleInfo == null) {
                result.setSuccess(false);
                result.setStatus(ProcessingStatus.INVALID);
                result.setMessage("Vehicle not found: " + licensePlate);
                return result;
            }

            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(vehicleInfo);
            result.setMessage("Vehicle info retrieved successfully");

            // PUSH real-time notification to frontend
            webSocketService.broadcastVehicleDetection(
                    cameraId, licensePlate, vehicleInfo, result.getStatus());

            // FUTURE EXTENSION: Additional processing
            // TODO: Có thể thêm:
            // - Kiểm tra blacklist
            // - Ghi nhận lịch sử ra vào
            // - Tính toán thời gian đỗ xe
            // - Gửi thông báo cho chủ xe

            return result;

        } catch (Exception e) {
            log.error("Error processing license plate: {}", e.getMessage());
            result.setSuccess(false);
            result.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
            result.setMessage("Error: " + e.getMessage());
            return result;
        }
    }
    @Override
    public boolean supports(String eventType) {
        return EventType.LICENSE_PLATE_DETECTION.name().equals(eventType);
    }
}