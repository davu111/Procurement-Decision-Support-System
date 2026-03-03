package com.ecotel.plan_service.model;

import com.ecotel.plan_service.enums.AreaCode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlanArea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    String vehiclePlanId;
    @Enumerated(EnumType.STRING)
    AreaCode areaCode;
}
