package com.ecotel.supplier_service.exception;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, UUID id) {
        super("Không tìm thấy " + resource + " với id: " + id);
    }
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
