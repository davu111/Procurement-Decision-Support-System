package com.ecotel.camera_service.dto.response;

import lombok.Data;

@Data
public class SafetyEquipmentStatusResponse {
    private String employeeId;
    private boolean helmet;
    private boolean vest;
}

