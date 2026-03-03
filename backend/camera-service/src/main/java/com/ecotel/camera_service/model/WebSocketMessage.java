package com.ecotel.camera_service.model;

import com.ecotel.camera_service.dto.response.transaction.TransactionResponse;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.enums.NotificationType;
import com.ecotel.camera_service.enums.ProcessingStatus;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessage {
    private NotificationType type;
    private EventType eventType;
    private String cameraId;
    private String identifier;
    private String warehouseId;
    private ProcessingStatus status;
    private Object result;
    private String message;
    private LocalDateTime timestamp;

    public static WebSocketMessage vehicleDetected(String cameraId,
                                                   String licensePlate,
                                                   Object vehicleInfo,
                                                   ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.VEHICLE_DETECTED);
        msg.setEventType(EventType.LICENSE_PLATE_DETECTION);
        msg.setCameraId(cameraId);
        msg.setIdentifier(licensePlate);
        msg.setResult(vehicleInfo);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage vehicleWarehousePlanDetected(String cameraId,
                                                                String licensePlate,
                                                                String warehouseId,
                                                                Object vehicleInfo,
                                                                ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.VEHICLE_WAREHOUSE_PLAN_DETECTED);
        msg.setEventType(EventType.VEHICLE_WAREHOUSE_PLAN_CHECK);
        msg.setCameraId(cameraId);
        msg.setIdentifier(licensePlate);
        msg.setWarehouseId(warehouseId);
        msg.setResult(vehicleInfo);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage employeeInfo(String cameraId,
                                                String idCard,
                                                Object employeeInfo,
                                                ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.EMPLOYEE_RECOGNIZED);
        msg.setEventType(EventType.EMPLOYEE_IDENTIFICATION);
        msg.setCameraId(cameraId);
        msg.setIdentifier(idCard);
        msg.setResult(employeeInfo);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage safetyViolation(String cameraId,
                                                   String employeeId,
                                                   Object violationDetails,
                                                   ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.SAFETY_VIOLATION);
        msg.setEventType(EventType.SAFETY_EQUIPMENT_CHECK);
        msg.setCameraId(cameraId);
        msg.setIdentifier(employeeId);
        msg.setResult(violationDetails);
        msg.setMessage("Safety equipment violation detected!");
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage eventProcessed(EventType eventType,
                                                  String cameraId,
                                                  String identifier,
                                                  Object result,
                                                  ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.EVENT_PROCESSED);
        msg.setEventType(eventType);
        msg.setCameraId(cameraId);
        msg.setIdentifier(identifier);
        msg.setResult(result);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage checkingQuantityDetected(String cameraId, String licensePlate,
                                                            String warehouseId,
                                                            TransactionResponse transactionInfo,
                                                            boolean mismatchFound,
                                                            ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.CHECKING_QUANTITY_ALERT);
        msg.setEventType(EventType.QUANTITY_CHECK);
        msg.setCameraId(cameraId);
        msg.setIdentifier(licensePlate);
        msg.setWarehouseId(warehouseId);
        msg.setResult(transactionInfo);
        msg.setMessage("Mismatch in quantity detected: " + mismatchFound);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage vehicleExit(String cameraId,
                                               String licensePlate,
                                               Object vehicleInfo,
                                               ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.GATE_EXIT);
        msg.setEventType(EventType.GATE_EXIT);
        msg.setCameraId(cameraId);
        msg.setIdentifier(licensePlate);
        msg.setResult(vehicleInfo);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }

    public static WebSocketMessage VehicleNotFoundAlert(String licensePlate, ProcessingStatus status) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(NotificationType.VEHICLE_NOT_FOUND);
        msg.setEventType(EventType.GATE_EXIT);
        msg.setIdentifier(licensePlate);
        msg.setStatus(status);
        msg.setTimestamp(LocalDateTime.now());
        return msg;
    }
}

