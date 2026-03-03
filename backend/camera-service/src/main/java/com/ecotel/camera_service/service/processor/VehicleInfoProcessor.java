package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.ProcessingResult;
import com.ecotel.camera_service.dto.response.vehicle.VehicleResponse;
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
public class VehicleInfoProcessor implements EventProcessor {
    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;

    @Override
    public ProcessingResult<VehicleResponse> process(String cameraId, CameraEventRequest request){
        ProcessingResult<VehicleResponse> result = new ProcessingResult<>();
        try {
            String licensePlate = request.getIdentifier();
            log.info("Processing vehicle info: {} from camera: {}",
                    licensePlate, cameraId);
            // Call vehicle-service to get vehicle info
            VehicleResponse vehicleInfo = externalServiceClient.getVehicleInfo(licensePlate);
            System.out.println("Vehicle info: " + vehicleInfo);
            if (vehicleInfo == null) {
                result.setSuccess(false);
                result.setStatus(ProcessingStatus.INVALID);
                result.setMessage("Vehicle not found with license plate: " + licensePlate);
                return result;
            }

            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(vehicleInfo);
            result.setMessage("Vehicle info retrieved successfully");

            // PUSH real-time notification to frontend
            webSocketService.broadcastVehicleInfoExit(
                    cameraId, licensePlate, vehicleInfo, result.getStatus());

            // FUTURE EXTENSION: Additional processing
            // TODO: Có thể thêm:

            return result;

        } catch (Exception e) {
            log.error("Error processing vehicle info: {}", e.getMessage());
            throw new RuntimeException("Failed to process vehicle info", e);
        }
    }

    @Override
    public boolean supports(String eventType) {
        return EventType.GATE_EXIT.name().equals(eventType);
    }
}


