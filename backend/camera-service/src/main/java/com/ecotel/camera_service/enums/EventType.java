package com.ecotel.camera_service.enums;

public enum EventType {
    LICENSE_PLATE_DETECTION,    // Nhận diện biển số xe
    SAFETY_EQUIPMENT_CHECK,     // Kiểm tra bảo hộ lao động
    EMPLOYEE_IDENTIFICATION,    // Nhận diện nhân viên
    VEHICLE_WAREHOUSE_PLAN_CHECK, // Kiểm tra xe theo kế hoạch kho bãi
    QUANTITY_CHECK,          // Kiểm tra số lượng hàng hóa
    FACE_RECOGNITION,           // Nhận diện khuôn mặt (future)
    GATE_ENTRY,                 // Xe vào cổng (future)
    GATE_EXIT,                  // Xe ra cổng (future)
    INTRUSION_DETECTION,        // Phát hiện xâm nhập (future)
    CROWD_COUNTING              // Đếm người (future)
}
