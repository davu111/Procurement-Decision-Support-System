package com.ecotel.transaction_service.enums;

// Enum cho trạng thái
public enum TransactionStatus {
    DRAFT,      // Phiếu tạm
    CONFIRMED,  // Đã xác nhận
    COMPLETED,  // Đã hoàn thành
    CANCELLED   // Đã hủy
}