package com.ecotel.camera_service.service;

import com.ecotel.camera_service.mapper.CameraEventMapper;
import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.dto.response.*;
import com.ecotel.camera_service.enums.EventStatus;
import com.ecotel.camera_service.model.CameraEvent;
import com.ecotel.camera_service.repository.CameraEventRepository;
import com.ecotel.camera_service.service.processor.EventProcessor;
import com.ecotel.camera_service.service.processor.LicensePlateProcessor;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CameraEventService {

    private final CameraEventRepository eventRepository;
    private final ValidationService validationService;
    private final List<EventProcessor> eventProcessors;
    private final LicensePlateProcessor licensePlateProcessor;
//    private final SafetyEquipmentProcessor safetyEquipmentProcessor;
//    private final EmployeeInfoProcessor employeeInfoProcessor;
    private final ObjectMapper objectMapper;
    private final CameraEventMapper cameraEventMapper;

    /**
     * Main method to process camera event
     * Optimized for handling 1000+ concurrent requests
     */
    @Transactional
    public CameraEventResponse processEvent(String cameraId,
                                            CameraEventRequest request) {

        log.info("Received event: type={}, identifier={}, camera={}",
                request.getEventType(), request.getIdentifier(), cameraId);

        // 1. Validation
        ValidationService.ValidationResult validationResult =
                validationService.validateEvent(request);

        if (!validationResult.isValid()) {
            log.warn("Validation failed: {}", validationResult.getErrorMessage());
            saveFailedEvent(cameraId, request, validationResult.getErrorMessage());
            return CameraEventResponse.invalid(validationResult.getErrorMessage());
        }

        // 2. Save event - deduplication handled by DB unique constraint
        try {
            CameraEvent event = saveEvent(cameraId, request, EventStatus.PENDING);

            // 3. Process event asynchronously
            processEventAsync(event);

            log.info("Event queued for async processing: id={}", event.getId());

            // 4. Return immediate response
            return CameraEventResponse.success(event.getId(), event.getProcessingResult());

        } catch (DataIntegrityViolationException e) {
            // Unique constraint violation = duplicate event
            log.info("Duplicate event detected via DB constraint: identifier={}",
                    request.getIdentifier());
            return CameraEventResponse.duplicate("Duplicate event within time window");
        }
    }

    /**
     * Async processing of event
     * Runs in separate transaction to avoid blocking the main request
     */
    @Async
    @Transactional
    public void processEventAsync(CameraEvent event) {
        try {
            log.info("Processing event async: id={}", event.getId());

            // Update status to PROCESSING
            updateEventStatus(event.getId(), EventStatus.PROCESSING);

            // Find appropriate processor
            EventProcessor processor = findProcessor(event.getEventType().name());

            if (processor == null) {
                log.error("No processor found for event type: {}",
                        event.getEventType());
                markEventFailed(event.getId(), "No processor available");
                return;
            }

            // Create request from event
            CameraEventRequest request = createRequestFromEvent(event);

            // Process
            System.out.println("Request " + request);
            ProcessingResult<?> result = processor.process(
                    event.getCameraId(), request);

            // Update event with result
            if (result.isSuccess()) {
                markEventCompleted(event.getId(), result);
            } else {
                markEventFailed(event.getId(), result.getMessage());
            }

        } catch (Exception e) {
            log.error("Error in async processing: id={}, error={}",
                    event.getId(), e.getMessage(), e);
            markEventFailed(event.getId(), "Processing error: " + e.getMessage());
        }
    }

    /**
     * Update event status atomically
     */
    private void updateEventStatus(Long eventId, EventStatus status) {
        eventRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(status);
            eventRepository.save(event);
        });
    }

    private EventProcessor findProcessor(String eventType) {
        return eventProcessors.stream()
                .filter(p -> p.supports(eventType))
                .findFirst()
                .orElse(null);
    }

    private CameraEvent saveEvent(String cameraId,
                                  CameraEventRequest request,
                                  EventStatus status) {
        CameraEvent event = cameraEventMapper.toCameraEvent(request);
        event.setCameraId(cameraId);
        event.setStatus(status);

        try {
            if (request.getMetadata() != null) {
                event.setMetadata(objectMapper.writeValueAsString(
                        request.getMetadata()));
            }
        } catch (Exception e) {
            log.error("Error serializing metadata: {}", e.getMessage());
        }

        return eventRepository.save(event);
    }

    private void saveFailedEvent(String cameraId,
                                 CameraEventRequest request,
                                 String errorMessage) {
        CameraEvent event = saveEvent(cameraId, request, EventStatus.FAILED);
        event.setErrorMessage(errorMessage);
        event.setProcessedAt(LocalDateTime.now());
        eventRepository.save(event);
    }

    private void markEventCompleted(Long eventId, ProcessingResult result) {
        eventRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(EventStatus.COMPLETED);
            event.setProcessedAt(LocalDateTime.now());

            try {
                if (result.getData() != null) {
                    event.setProcessingResult(result.getData());
                }
            } catch (Exception e) {
                log.error("Error serializing result: {}", e.getMessage());
            }

            eventRepository.save(event);
            log.info("Event completed: id={}", event.getId());
        });
    }

    private void markEventFailed(Long eventId, String errorMessage) {
        eventRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(EventStatus.FAILED);
            event.setProcessedAt(LocalDateTime.now());
            event.setErrorMessage(errorMessage);
            eventRepository.save(event);
            log.error("Event failed: id={}, error={}", event.getId(), errorMessage);
        });
    }

    private CameraEventRequest createRequestFromEvent(CameraEvent event) {
        CameraEventRequest request = cameraEventMapper.toCameraEventRequest(event);

        try {
            Object metadataObj = event.getMetadata();

            if (metadataObj != null) {
                Map<String, Object> metadata;

                if (metadataObj instanceof String) {
                    // Nếu là String JSON
                    String metadataJson = (String) metadataObj;
                    if (!metadataJson.trim().isEmpty()) {
                        metadata = objectMapper.readValue(
                                metadataJson,
                                new TypeReference<Map<String, Object>>() {}
                        );
                        request.setMetadata(metadata);
                    }
                } else if (metadataObj instanceof Map) {
                    // Nếu đã là Map, dùng trực tiếp
                    metadata = (Map<String, Object>) metadataObj;
                    request.setMetadata(metadata);
                } else {
                    // Các trường hợp khác: convert
                    metadata = objectMapper.convertValue(
                            metadataObj,
                            new TypeReference<Map<String, Object>>() {}
                    );
                    request.setMetadata(metadata);
                }
            }
        } catch (Exception e) {
            log.error("Error deserializing metadata: {}", e.getMessage(), e);
        }

        return request;
    }

    // FUTURE EXTENSION: Query methods
    /**
     * TODO: Có thể thêm các methods:
     * - getEventHistory(): Lấy lịch sử events
     * - getEventsByCamera(): Lấy events theo camera
     * - getEventsByTimeRange(): Lấy events theo khoảng thời gian
     * - getStatistics(): Thống kê events
     * - retryFailedEvents(): Retry các events failed
     */
}
