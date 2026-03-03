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
public class VehicleWarehousePlanProcessor implements EventProcessor {
    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;

    @Override
    public ProcessingResult<Object> process(String cameraId, CameraEventRequest request){
        ProcessingResult<Object> result = new ProcessingResult<>();
        try {
            String licensePlate = request.getIdentifier();
            String warehouseId = request.getWarehouseId();
            log.info("Processing vehicle warehouse plan info: {} from camera: {} in warehouse: {}",
                    licensePlate, cameraId, warehouseId);
            // Call vehicle warehouse plan-service to get vehicle warehouse plan info
            Object vehicleWarehousePlan = externalServiceClient.getVehicleWarehousePlan(licensePlate, warehouseId);
            System.out.println("Vehicle Warehouse Plan info: " + vehicleWarehousePlan);
            if (vehicleWarehousePlan == null) {
                result.setSuccess(false);
                result.setStatus(ProcessingStatus.INVALID);
                result.setMessage("Vehicle Plan not found with id card: " + licensePlate + " in warehouse: " + warehouseId);
                return result;
            }
            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(vehicleWarehousePlan);
            result.setMessage("Vehicle Warehouse Plan info retrieved successfully");

            // PUSH real-time notification to frontend
            webSocketService.broadcastVehicleWarehousePlan(
                    cameraId, licensePlate, warehouseId, vehicleWarehousePlan, result.getStatus());

            // FUTURE EXTENSION: Additional processing
            // TODO: Có thể thêm:

            return result;

        } catch (Exception e) {
            log.error("Error processing vehicle warehouse plan info: {}", e.getMessage());
            throw new RuntimeException("Failed to process vehicle plan info", e);
        }
    }

    @Override
    public boolean supports(String eventType) {
        return EventType.VEHICLE_WAREHOUSE_PLAN_CHECK.name().equals(eventType);
    }
}
