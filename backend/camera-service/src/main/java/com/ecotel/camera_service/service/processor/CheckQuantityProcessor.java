package com.ecotel.camera_service.service.processor;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.request.checking_quantity.ProductQuantityCheckMetadata;
import com.ecotel.camera_service.dto.response.ProcessingResult;
import com.ecotel.camera_service.dto.response.transaction.DetailTransactionResponse;
import com.ecotel.camera_service.dto.response.transaction.TransactionResponse;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.enums.ProcessingStatus;
import com.ecotel.camera_service.service.ExternalServiceClient;
import com.ecotel.camera_service.service.WebSocketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckQuantityProcessor implements EventProcessor {
    private final ExternalServiceClient externalServiceClient;
    private final WebSocketService webSocketService;
    private final ObjectMapper objectMapper;

    @Override
    public ProcessingResult<Object> process(String cameraId, CameraEventRequest request){
        ProcessingResult<Object> result = new ProcessingResult<>();
        try {
            String licensePlate = request.getIdentifier();
            String warehouseId = request.getWarehouseId();
            log.info("Processing vehicle warehouse plan info: {} from camera: {} in warehouse: {}",
                    licensePlate, cameraId, warehouseId);
            // Call vehicle warehouse plan-service to get vehicle warehouse plan info
            TransactionResponse vehicleWarehousePlan = externalServiceClient.getVehicleWarehousePlan(licensePlate, warehouseId);
            System.out.println("Vehicle Warehouse Plan info: " + vehicleWarehousePlan);
            if (vehicleWarehousePlan == null) {
                result.setSuccess(false);
                result.setStatus(ProcessingStatus.INVALID);
                result.setMessage("Vehicle Plan not found with id card: " + licensePlate + " in warehouse: " + warehouseId);
                return result;
            }

            // Check quantity
            boolean mismatchFound = false;
            System.out.println("request metadata: " + request.getMetadata());
            ProductQuantityCheckMetadata metadata =
                    objectMapper.convertValue(request.getMetadata(), ProductQuantityCheckMetadata.class);

            System.out.println("metadata: " + metadata);
            List<ProductQuantityCheckMetadata.DetectedItem> detectedItems = metadata.getDetectedItems();

            // So sánh với VehicleWarehousePlan
            for (ProductQuantityCheckMetadata.DetectedItem detectedItem : detectedItems) {
                Optional<DetailTransactionResponse> planDetailOpt = vehicleWarehousePlan.getDetailTransactionResponses().stream()
                        .filter(planDetail -> planDetail.getProductId().equals(detectedItem.getProductId()))
                        .findFirst();

                if (planDetailOpt.isPresent()) {
                    DetailTransactionResponse planDetail = planDetailOpt.get();
                    BigDecimal plannedQty = planDetail.getPlannedQuantity();
                    BigDecimal detectedQty = detectedItem.getActualQuantity();
                    planDetail.setActualQuantity(detectedQty);

                    if (plannedQty.compareTo(detectedQty) != 0) {
                        log.warn("Quantity mismatch for product {}: planned {}, detected {}",
                                detectedItem.getProductId(), plannedQty, detectedQty);
                        mismatchFound = true;
                    }
                }
            }

            result.setSuccess(true);
            result.setStatus(ProcessingStatus.SUCCESS);
            result.setData(vehicleWarehousePlan);
            result.setMessage("Quantity mismatch found: " + mismatchFound);

            // PUSH real-time notification to frontend
            webSocketService.broadcastCheckingQuantity(
                    cameraId, licensePlate, warehouseId, vehicleWarehousePlan, mismatchFound, result.getStatus());

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
        return EventType.QUANTITY_CHECK.name().equals(eventType);
    }
}
