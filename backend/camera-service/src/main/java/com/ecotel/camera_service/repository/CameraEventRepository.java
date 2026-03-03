package com.ecotel.camera_service.repository;

import com.ecotel.camera_service.enums.EventType;
import com.ecotel.camera_service.model.CameraEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CameraEventRepository extends JpaRepository<CameraEvent, Long> {

    List<CameraEvent> findByCameraIdAndDetectedAtAfter(
            String cameraId, LocalDateTime after);

    List<CameraEvent> findByEventTypeAndIdentifier(
            EventType eventType, String identifier);

    @Query("SELECT e FROM CameraEvent e WHERE e.cameraId = :cameraId " +
            "AND e.detectedAt >= :startTime ORDER BY e.detectedAt DESC")
    List<CameraEvent> findRecentEventsByCamera(
            String cameraId, LocalDateTime startTime);
}

