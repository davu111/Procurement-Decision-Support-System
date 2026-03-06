package com.ecotel.inventory_optimization_service.enums;

public enum ForecastModel {
    MANUAL("Nhập tay", "Người dùng nhập trực tiếp"),
    WMA("Trung bình trượt có trọng số", "Dùng khi có < 6 điểm dữ liệu"),
    HOLT_WINTERS("Holt-Winters", "Dùng khi có 6-18 điểm dữ liệu, xử lý trend + mùa vụ"),
    SEASONAL_REGRESSION("Hồi quy + Mùa vụ", "Dùng khi có > 18 điểm dữ liệu");

    private final String displayName;
    private final String description;

    ForecastModel(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }
}
