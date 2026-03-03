package com.ecotel.camera_service.exception;

import com.ecotel.camera_service.dto.response.CameraEventResponse;
import com.ecotel.camera_service.enums.ProcessingStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(CameraServiceException.class)
    public ResponseEntity<CameraEventResponse> handleCameraServiceException(
            CameraServiceException ex) {

        log.error("Camera service error: {}", ex.getMessage());

        CameraEventResponse response = new CameraEventResponse();
        response.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
        response.setMessage(ex.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        String uri = request.getRequestURI();

        // không xử lý exception của Actuator - để Spring Boot xử lý
        if (uri.startsWith("/actuator") || uri.startsWith("/health")) {
            log.error("Error on actuator endpoint {}: {}", uri, ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }

        log.error("Unexpected error at {}: {}", uri, ex.getMessage(), ex);

        CameraEventResponse response = new CameraEventResponse();
        response.setStatus(ProcessingStatus.EXTERNAL_SERVICE_ERROR);
        response.setMessage("An unexpected error occurred");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

}
