package com.ecotel.camera_service.dto.response;

import com.ecotel.camera_service.enums.ProcessingStatus;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = VehiclePlanResult.class, name = "VEHICLE"),
        @JsonSubTypes.Type(value = SafeEquipmentResult.class, name = "SAFETY_EQUIPMENT")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProcessingResult <T> {
    // field chung
    boolean success;
    ProcessingStatus status;
    String message;
    T data;
    Long eventId;
}