package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.PositionRequest;
import com.ecotel.employee_service.dto.request.PositionUpdateRequest;
import com.ecotel.employee_service.dto.response.PositionResponse;
import com.ecotel.employee_service.mapper.PositionMapper;
import com.ecotel.employee_service.model.Position;
import com.ecotel.employee_service.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PositionService {

    private final PositionRepository positionRepository;
    private final PositionMapper positionMapper;

    /**
     * Lấy tất cả positions
     */
    public List<PositionResponse> getAllPositions() {
        log.info("Fetching all positions");
        return positionRepository.findAll().stream()
                .map(positionMapper::toResponse)
                .toList();
    }

    /**
     * Lấy positions theo trang
     */
    public Page<PositionResponse> getPositionsPaginated(Pageable pageable) {
        log.info("Fetching positions with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return positionRepository.findAll(pageable)
                .map(positionMapper::toResponse);
    }

    /**
     * Lấy position theo ID
     */
    public PositionResponse getPositionById(String id) {
        log.info("Fetching position with id: {}", id);
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found with id: " + id));
        return positionMapper.toResponse(position);
    }

    /**
     * Tạo position mới
     */
    @Transactional
    public PositionResponse createPosition(PositionRequest positionRequest) {
        log.info("Creating new position: {}", positionRequest.getPositionName());

        try {
            Position position = positionMapper.toEntity(positionRequest);
            Position savedPosition = positionRepository.save(position);
            log.info("Position created with id: {}", savedPosition.getId());
            return positionMapper.toResponse(savedPosition);
        } catch (Exception e) {
            log.error("Error creating position: {}", e.getMessage());
            throw new RuntimeException("Failed to create position", e);
        }
    }

    /**
     * Cập nhật position
     */
    @Transactional
    public PositionResponse updatePosition(String id, PositionRequest positionRequest) {
        log.info("Updating position with id: {}", id);

        try {
            Position position = positionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Position not found with id: " + id));

            positionMapper.updateEntityFromRequest(positionRequest, position);

            Position updatedPosition = positionRepository.save(position);
            log.info("Position updated: {}", id);

            return positionMapper.toResponse(updatedPosition);
        } catch (Exception e) {
            log.error("Error updating position: {}", e.getMessage());
            throw new RuntimeException("Failed to update position", e);
        }
    }

    /**
     * Xóa position
     */
    @Transactional
    public void deletePosition(String id) {
        log.info("Deleting position with id: {}", id);

        try {
            Position position = positionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Position not found with id: " + id));
            positionRepository.deleteById(id);
            log.info("Position deleted: {} ({})", position.getPositionName(), id);
        } catch (Exception e) {
            log.error("Error deleting position: {}", e.getMessage());
            throw new RuntimeException("Failed to delete position", e);
        }
    }

    /**
     * Batch create positions
     * Tạo nhiều positions cùng lúc
     */
    @Transactional
    public List<PositionResponse> createPositionsBatch(List<PositionRequest> positions) {
        log.info("Creating {} positions in batch", positions.size());

        try {
            List<PositionResponse> savedPositions = new ArrayList<>();

            for (PositionRequest positionRequest : positions) {
                try {
                    Position position = positionMapper.toEntity(positionRequest);

                    Position savedPosition = positionRepository.save(position);
                    savedPositions.add(positionMapper.toResponse(savedPosition));
                    log.info("Batch: Position created - {} ({})", position.getPositionName(), savedPosition.getId());
                } catch (Exception e) {
                    log.warn("Batch: Failed to create position {}: {}", positionRequest.getPositionName(), e.getMessage());
                    // Tiếp tục với position tiếp theo
                }
            }

            log.info("Batch creation completed: {} positions created successfully", savedPositions.size());
            return savedPositions;
        } catch (Exception e) {
            log.error("Error in batch creation: {}", e.getMessage());
            throw new RuntimeException("Failed to create positions in batch", e);
        }
    }

    /**
     * Batch update positions
     */
    @Transactional
    public List<PositionResponse> updatePositionsBatch(List<PositionUpdateRequest> positions) {
        log.info("Updating {} positions in batch", positions.size());

        try {
            List<PositionResponse> updatedPositions = new ArrayList<>();

            for (PositionUpdateRequest positionRequest : positions) {
                try {
                    Position position = positionRepository.findById(positionRequest.getId())
                            .orElseThrow(() -> new RuntimeException("Position not found with id: " + positionRequest.getId()));

                    positionMapper.updateEntityFromUpdateRequest(positionRequest, position);

                    Position updatedPosition = positionRepository.save(position);
                    updatedPositions.add(positionMapper.toResponse(updatedPosition));
                    log.info("Batch: Position updated - {}", positionRequest.getPositionName());
                } catch (Exception e) {
                    log.warn("Batch: Failed to update position {}: {}", positionRequest.getId(), e.getMessage());
                    // Tiếp tục với position tiếp theo
                }
            }

            log.info("Batch update completed: {} positions updated successfully", updatedPositions.size());
            return updatedPositions;
        } catch (Exception e) {
            log.error("Error in batch update: {}", e.getMessage());
            throw new RuntimeException("Failed to update positions in batch", e);
        }
    }

    /**
     * Batch delete positions
     */
    @Transactional
    public void deletePositionsBatch(List<String> ids) {
        log.info("Deleting {} positions in batch", ids.size());

        try {
            for (String id : ids) {
                try {
                    Position position = positionRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Position not found with id: " + id));
                    positionRepository.deleteById(id);
                    log.info("Batch: Position deleted - {} ({})", position.getPositionName(), id);
                } catch (Exception e) {
                    log.warn("Batch: Failed to delete position {}: {}", id, e.getMessage());
                    // Tiếp tục với position tiếp theo
                }
            }

            log.info("Batch deletion completed");
        } catch (Exception e) {
            log.error("Error in batch deletion: {}", e.getMessage());
            throw new RuntimeException("Failed to delete positions in batch", e);
        }
    }
}
