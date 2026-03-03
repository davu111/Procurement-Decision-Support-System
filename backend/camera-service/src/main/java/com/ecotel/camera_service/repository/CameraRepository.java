package com.ecotel.camera_service.repository;

import com.ecotel.camera_service.model.Camera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CameraRepository extends JpaRepository<Camera, String> {
    Camera findByCameraIdAndApiKey(String cameraId, String apiKey);
}
