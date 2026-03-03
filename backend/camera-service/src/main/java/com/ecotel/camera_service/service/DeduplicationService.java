package com.ecotel.camera_service.service;

import com.ecotel.camera_service.enums.EventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeduplicationService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${camera.deduplication.window-seconds:30}")
    private int deduplicationWindowSeconds;

    /**
     * Kiểm tra và đánh dấu event đã được xử lý
     *
     * @return true nếu là duplicate, false nếu là event mới
     */
    public boolean checkAndMarkProcessed(String cameraId,
                                         EventType eventType,
                                         String identifier) {
        String key = generateDeduplicationKey(cameraId, eventType, identifier);

        // Kiểm tra xem key đã tồn tại chưa
        Boolean exists = redisTemplate.hasKey(key);

        if (Boolean.TRUE.equals(exists)) {
            log.info("Duplicate event detected: camera={}, type={}, identifier={}",
                    cameraId, eventType, identifier);
            return true;
        }

        // Đánh dấu đã xử lý với TTL
        redisTemplate.opsForValue().set(
                key,
                LocalDateTime.now().toString(),
                Duration.ofSeconds(deduplicationWindowSeconds)
        );

        log.debug("Event marked as processed: {}", key);
        return false;
    }

    /**
     * Xóa đánh dấu duplicate (dùng cho testing hoặc retry)
     */
    public void clearDuplicateFlag(String cameraId,
                                   EventType eventType,
                                   String identifier) {
        String key = generateDeduplicationKey(cameraId, eventType, identifier);
        redisTemplate.delete(key);
    }

    private String generateDeduplicationKey(String cameraId,
                                            EventType eventType,
                                            String identifier) {
        return String.format("camera:event:%s:%s:%s",
                cameraId, eventType.name(), identifier);
    }

    // FUTURE EXTENSION: Advanced deduplication strategies
    /**
     * TODO: Có thể thêm các strategy khác:
     * - checkDuplicateAcrossCameras(): Kiểm tra cùng identifier trên nhiều camera
     * - checkDuplicateWithinTimeRange(): Kiểm tra trong khoảng thời gian linh hoạt
     * - checkDuplicateWithSimilarity(): Dùng fuzzy matching cho identifier
     */
}
