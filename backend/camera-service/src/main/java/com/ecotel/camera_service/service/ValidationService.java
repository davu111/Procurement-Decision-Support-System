package com.ecotel.camera_service.service;

import com.ecotel.camera_service.dto.request.CameraEventRequest;
import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.model.Camera;
import com.ecotel.camera_service.repository.CameraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ValidationService {

    private final CameraRepository cameraRepository;

    @Value("${camera.validation.min-confidence:0.7}")
    private float minConfidence;

    @Value("${camera.validation.max-event-age-minutes:5}")
    private int maxEventAgeMinutes;

    // Regex patterns
    private static final Pattern LICENSE_PLATE_PATTERN =
            Pattern.compile("^\\d{2}[A-Z]{1,2}-\\d{4,5}$");

    private static final Pattern EMPLOYEE_ID_PATTERN =
            Pattern.compile("^EMP\\d{6}$");

    /**
     * Validate camera credentials
     */
    public boolean validateCamera(String cameraId, String apiKey) {
        try {
            Camera camera = cameraRepository.findByCameraIdAndApiKey(cameraId, apiKey);

            if (camera == null) {
                log.warn("Invalid camera credentials: cameraId={}", cameraId);
                return false;
            }

            if (!camera.getActive()) {
                log.warn("Camera is inactive: cameraId={}", cameraId);
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Error validating camera: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate event request
     */
    public ValidationResult validateEvent(CameraEventRequest request) {

        // 1. Kiểm tra timestamp (không quá cũ)
        long minutesAgo = ChronoUnit.MINUTES.between(
                request.getDetectedAt(), LocalDateTime.now());

        if (minutesAgo > maxEventAgeMinutes) {
            return ValidationResult.invalid(
                    String.format("Event is too old: %d minutes", minutesAgo));
        }

        // 2. Validate identifier theo event type
        String validationError = validateIdentifier(
                request.getEventType(), request.getIdentifier());

        if (validationError != null) {
            return ValidationResult.invalid(validationError);
        }

        return ValidationResult.valid();
    }

    private String validateIdentifier(EventType eventType, String identifier) {
        switch (eventType) {
            case LICENSE_PLATE_DETECTION:
                if (!LICENSE_PLATE_PATTERN.matcher(identifier).matches()) {
                    return "Invalid license plate format. Expected: 99X-9999 or 99XX-99999";
                }
                break;

            case SAFETY_EQUIPMENT_CHECK:
                // Cho phép UNKNOWN nếu không nhận diện được
                if (!"UNKNOWN".equals(identifier) &&
                        !EMPLOYEE_ID_PATTERN.matcher(identifier).matches()) {
                    return "Invalid employee ID format";
                }
                break;

            // FUTURE EXTENSION: Add validation for other event types
            case FACE_RECOGNITION:
            case GATE_ENTRY:
            case GATE_EXIT:
                // TODO: Implement validation logic
                break;
        }

        return null; // Valid
    }

    // Validation result class
    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String message) {
            return new ValidationResult(false, message);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }

    // FUTURE EXTENSION: Additional validation methods
    /**
     * TODO: Có thể thêm:
     * - validateImageUrl(): Kiểm tra URL ảnh có hợp lệ
     * - validateMetadata(): Validate metadata theo event type
     * - validateBusinessRules(): Kiểm tra business rules phức tạp
     */
}
