package com.ecotel.camera_service.enums;

public enum NotificationType {
    VEHICLE_DETECTED,           // Phát hiện xe
    VEHICLE_WAREHOUSE_PLAN_DETECTED,   // Xe theo kế hoạch kho bãi
    VEHICLE_UNPLANNED_DETECTED, // Xe không theo kế hoạch
    CHECKING_QUANTITY_ALERT,   // Cảnh báo kiểm đếm
    GATE_EXIT,                   // Xe ra cổng
    SAFETY_VIOLATION,           // Vi phạm bảo hộ
    EMPLOYEE_RECOGNIZED,      // Nhân viên được nhận diện
    EVENT_PROCESSED,            // Event đã xử lý xong
    SYSTEM_ALERT,              // Cảnh báo hệ thống
    CAMERA_STATUS,              // Trạng thái camera
    VEHICLE_NOT_FOUND,         // Xe không tìm thấy
    EMPLOYEE_NOT_FOUND,         // Nhân viên không tìm thấy
    VEHICLE_PLAN_NOT_FOUND    // Kế hoạch xe không tìm thấy
}
