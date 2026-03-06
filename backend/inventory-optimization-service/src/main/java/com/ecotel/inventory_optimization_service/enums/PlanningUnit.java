package com.ecotel.inventory_optimization_service.enums;

public enum PlanningUnit {
    MONTH("Tháng", 1),
    QUARTER("Quý", 3),
    YEAR("Năm", 12);

    private final String displayName;
    private final int months; // số tháng tương ứng

    PlanningUnit(String displayName, int months) {
        this.displayName = displayName;
        this.months = months;
    }

    public String getDisplayName() { return displayName; }
    public int getMonths() { return months; }
}
