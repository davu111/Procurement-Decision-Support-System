package com.ecotel.camera_service.enums;

public enum EventStatus {
    PENDING,        // Đang chờ xử lý
    PROCESSING,     // Đang xử lý
    COMPLETED,      // Hoàn thành
    FAILED,         // Thất bại
    DUPLICATE       // Trùng lặp
}
