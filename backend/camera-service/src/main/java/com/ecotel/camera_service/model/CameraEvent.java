package com.ecotel.camera_service.model;

import com.ecotel.camera_service.enums.EventStatus;
import com.ecotel.camera_service.enums.EventType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "camera_events",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_event_deduplication",
                        columnNames = {"camera_id", "event_type", "identifier", "detected_at"}
                )
        },
        indexes = {
                @Index(name = "idx_camera_status", columnList = "camera_id, status"),
                @Index(name = "idx_identifier", columnList = "identifier"),
                @Index(name = "idx_detected_at", columnList = "detected_at"),
                @Index(name = "idx_status_created", columnList = "status, created_at")
        }
)
@Data
public class CameraEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cameraId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    // Identifier: biển số xe, ID nhân viên, etc.
    @Column(nullable = false)
    private String identifier;

    private String warehouseId;

    // Thời gian camera phát hiện
    @Column(nullable = false)
    private LocalDateTime detectedAt;

    // Thời gian hệ thống nhận được
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime receivedAt;

    // Thời gian xử lý xong
    private LocalDateTime processedAt;

    // URL ảnh từ camera
    private String imageUrl;

    // Kết quả xử lý
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "json")
    private Object metadata;

    // Kết quả xử lý
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "processing_result", columnDefinition = "json")
    private Object processingResult;

    // Error message nếu có
    private String errorMessage;
}
