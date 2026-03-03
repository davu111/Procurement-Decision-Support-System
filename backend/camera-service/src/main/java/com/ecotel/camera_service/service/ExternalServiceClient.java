package com.ecotel.camera_service.service;

import com.ecotel.camera_service.dto.response.ApiResponse;
import com.ecotel.camera_service.dto.response.SafetyEquipmentStatusResponse;
import com.ecotel.camera_service.dto.response.transaction.TransactionResponse;
import com.ecotel.camera_service.dto.response.vehicle.VehicleResponse;
import com.ecotel.camera_service.dto.response.vehicle_plan.VehiclePlanResponse;
import com.ecotel.camera_service.enums.ProcessingStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Slf4j
@Component
public class ExternalServiceClient {

    private final WebClient webClient;
    private final WebSocketService webSocketService;

    @Value("${external.plan-service.url}")
    private String planServiceUrl;

    @Value("${external.employee-service.url}")
    private String employeeServiceUrl;

    @Value("${external.vehicle-service.url}")
    private String vehicleServiceUrl;

    public ExternalServiceClient(WebClient webClient, WebSocketService webSocketService) {
        this.webSocketService = webSocketService;
        this.webClient = webClient;
    }

    /**
     * Get vehicle information by license plate
     */
    public VehiclePlanResponse getVehiclePlan(String licensePlate) {
        try {
            return webClient.get()
                    .uri(planServiceUrl + "/plans/search/{licensePlate}", licensePlate)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "Plan service error: " + body)))
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<VehiclePlanResponse>>() {})
                    .map(ApiResponse::getData)
                    .block();

        } catch (Exception e) {
            log.error("Error calling plan-service for {}: {}", licensePlate, e.getMessage());
            throw new RuntimeException("Failed to get vehicle info", e);
        }
    }

    /**
     * Update employee safety equipment status
     */
    public SafetyEquipmentStatusResponse updateSafetyEquipmentStatus(
            String employeeId,
            Map<String, Object> status) {

        try {
            return webClient.put()
                    .uri(employeeServiceUrl + "/employees/{id}/safety-equipment", employeeId)
                    .bodyValue(status)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "Employee service error: " + body)))
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<SafetyEquipmentStatusResponse>>() {})
                    .map(ApiResponse::getData)
                    .block();

        } catch (Exception e) {
            log.error("Error calling employee-service for {}: {}", employeeId, e.getMessage());
            throw new RuntimeException("Failed to update safety status", e);
        }
    }

    public Object getEmployeeInfo (String idCard) {
        try {
            return webClient.get()
                    .uri(employeeServiceUrl + "/employees/id-card/{idCard}", idCard)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "Employee service error: " + body)))
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<Object>>() {})
                    .map(ApiResponse::getData)
                    .block();

        } catch (Exception e) {
            log.error("Error calling employee-service for idCard {}: {}", idCard, e.getMessage());
            throw new RuntimeException("Failed to update safety status", e);
        }
    }

    public TransactionResponse getVehicleWarehousePlan (String licensePlate, String warehouseId) {
        try {
            return webClient.get()
                    .uri(planServiceUrl + "/plans/search/{licensePlate}/{warehouseId}", licensePlate, warehouseId)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "Plan service error: " + body)))
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<TransactionResponse>>() {})
                    .map(ApiResponse::getData)
                    .block();

        } catch (Exception e) {
            log.error("Error calling plan-service for {} in {}: {}", licensePlate, warehouseId, e.getMessage());
            throw new RuntimeException("Failed to get vehicle warehouse plan", e);
        }
    }

    public VehicleResponse getVehicleInfo (String licensePlate) {
        try {
            return webClient.get()
                    .uri(vehicleServiceUrl + "/vehicles/license-plate/{licensePlate}", licensePlate)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(body -> new RuntimeException(
                                            "Vehicle service error: " + body)))
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<VehicleResponse>>() {})
                    .map(ApiResponse::getData)
                    .block();

        } catch (Exception e) {
            log.error("Error calling vehicle-service for licensePlate {}: {}", licensePlate, e.getMessage());
            webSocketService.broadcastVehicleNotFoundAlert(licensePlate, ProcessingStatus.FAILED);
            throw new RuntimeException("Failed to get vehicle info", e);
        }
    }
}

