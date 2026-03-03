package com.ecotel.plan_service.model;

import com.ecotel.plan_service.enums.WorkType;
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
public class DetailPlan {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    String id;
    String vehiclePlanId;
    @Enumerated(EnumType.STRING)
    WorkType workType;
    @Column(nullable = false)
    @Builder.Default
    Integer sequenceOrder = 1;
}
