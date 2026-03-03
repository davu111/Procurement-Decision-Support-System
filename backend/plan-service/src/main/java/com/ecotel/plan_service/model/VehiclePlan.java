package com.ecotel.plan_service.model;

import com.ecotel.plan_service.enums.Purpose;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class VehiclePlan {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    String id;
    String planId;
    String licensePlate;
    @Enumerated(EnumType.STRING)
    Purpose purpose;
    String driverId;

    @CreationTimestamp
    LocalDateTime createdAt;
}
