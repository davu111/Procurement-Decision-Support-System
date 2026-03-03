package com.ecotel.camera_service.dto.request;

import com.ecotel.camera_service.dto.request.checking_quantity.EventMetadata;
import com.ecotel.camera_service.enums.EventType;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class CameraEventRequest {

    private EventType eventType;

    private String identifier;
    private String warehouseId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime detectedAt;

    private String imageUrl;

    // Metadata tùy chọn theo loại event
    private Map<String, Object> metadata;
}
