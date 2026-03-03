package com.ecotel.camera_service.service;

import com.ecotel.camera_service.dto.response.transaction.TransactionResponse;
import com.ecotel.camera_service.dto.response.vehicle.VehicleResponse;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.enums.ProcessingStatus;
import com.ecotel.camera_service.model.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import static com.ecotel.camera_service.enums.NotificationType.CAMERA_STATUS;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast message to all subscribers of a topic
     */
    public void broadcast(String topic, WebSocketMessage message) {
        log.info("Broadcasting to {}: {}", topic, message.getType());
        messagingTemplate.convertAndSend(topic, message);
    }

    /**
     * Send message to specific user
     */
    public void sendToUser(String username, String destination, WebSocketMessage message) {
        log.info("Sending to user {}: {}", username, message.getType());
        messagingTemplate.convertAndSendToUser(username, destination, message);
    }

    /**
     * Broadcast vehicle detection event
     */
    public void broadcastVehicleDetection(String cameraId,
                                          String licensePlate,
                                          Object vehicleInfo,
                                          ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.vehicleDetected(
                cameraId, licensePlate, vehicleInfo, status);

        // Broadcast to general topic
        broadcast("/topic/vehicles", message);

        // Also broadcast to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    // Broadcast vehicle exit event
    public void broadcastVehicleInfoExit(String cameraId,
                                         String licensePlate,
                                         VehicleResponse vehicleInfo, ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.vehicleExit(
                cameraId, licensePlate, vehicleInfo, status);

        // Broadcast to general topic
        if (vehicleInfo != null && vehicleInfo.getInWarehouseFlag()) broadcast("/topic/vehicles", message);
        else if (vehicleInfo != null) broadcast("/topic/alerts", message);
        else broadcast("/topic/alerts", message);

        // Also broadcast to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    // Broadcast vehicle warehouse plan event
    public void broadcastVehicleWarehousePlan(String cameraId,
                                              String licensePlate,
                                              String warehouseId,
                                              Object vehicleWarehousePlan,
                                              ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.vehicleWarehousePlanDetected(
                cameraId, licensePlate, warehouseId, vehicleWarehousePlan, status);

        // Broadcast to general topic
        broadcast("/topic/vehicles", message);

        // Also broadcast to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    // Broadcast checking quantity event
    public void broadcastCheckingQuantity(String cameraId,
                                          String licensePlate,
                                          String warehouseId,
                                          TransactionResponse transactionInfo,
                                          boolean mismatchFound,
                                          ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.checkingQuantityDetected(
                cameraId, licensePlate, warehouseId, transactionInfo, mismatchFound, status);
        // Broadcast to alerts topic (high priority)
        if (mismatchFound) broadcast("/topic/alerts", message);
        else broadcast("/topic/vehicles", message);

        // Also to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    // Broadcast employee info event
    public void broadcastEmployeeInfo(String cameraId,
                                      String idCard,
                                      Object employeeInfo,
                                      ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.employeeInfo(
                cameraId, idCard, employeeInfo, status);
        // Broadcast to general topic
        broadcast("/topic/employees", message);
        // Also broadcast to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    /**
     * Broadcast safety violation alert
     */
    public void broadcastSafetyViolation(String cameraId,
                                         String employeeId,
                                         Object violationDetails,
                                         ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.safetyViolation(
                cameraId, employeeId, violationDetails, status);

        // Broadcast to alerts topic (high priority)
        broadcast("/topic/alerts", message);

        // Also to camera-specific topic
        broadcast("/topic/camera/" + cameraId, message);
    }

    /**
     * Notify event processing completed
     */
    public void notifyEventProcessed(EventType eventType,
                                     String cameraId,
                                     String identifier,
                                     Object result,
                                     ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.eventProcessed(
                eventType, cameraId, identifier, result, status);

        broadcast("/topic/events", message);
    }

    /**
     * Send camera status update
     */
    public void sendCameraStatus(String cameraId, String status) {
        WebSocketMessage message = new WebSocketMessage();
        message.setType(CAMERA_STATUS);
        message.setCameraId(cameraId);
        message.setMessage(status);
        message.setTimestamp(java.time.LocalDateTime.now());

        broadcast("/topic/camera/" + cameraId + "/status", message);
    }

    // NOT FOUND ALERT
    public void broadcastVehicleNotFoundAlert(String licensePlate, ProcessingStatus status) {
        WebSocketMessage message = WebSocketMessage.VehicleNotFoundAlert(licensePlate, status);
        // Broadcast to alerts topic (high priority)
        broadcast("/topic/alerts", message);
    }
}
