package com.ecotel.camera_service.exception;


public class CameraServiceException extends RuntimeException {
    public CameraServiceException(String message) {
        super(message);
    }

    public CameraServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
