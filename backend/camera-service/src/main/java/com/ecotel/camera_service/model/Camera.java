package com.ecotel.camera_service.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cameras")
@Data
public class Camera {

    @Id
    private String cameraId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String apiKey;

    private Boolean active = true;

    // Cấu hình đặc thù cho camera
    @Column(columnDefinition = "TEXT")
    private String configuration;
}
