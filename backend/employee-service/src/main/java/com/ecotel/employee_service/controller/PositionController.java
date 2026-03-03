package com.ecotel.employee_service.controller;

import com.ecotel.employee_service.dto.request.PositionRequest;
import com.ecotel.employee_service.dto.request.PositionUpdateRequest;
import com.ecotel.employee_service.dto.response.ApiResponse;
import com.ecotel.employee_service.dto.response.PositionResponse;
import com.ecotel.employee_service.service.PositionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@Slf4j
public class PositionController {

    private final PositionService positionService;

    /**
     * Lấy tất cả positions
     * GET /api/positions
     */
    @GetMapping
    public ApiResponse<List<PositionResponse>> getAllPositions() {
        log.info("REST request to get all positions");
        List<PositionResponse> responses = positionService.getAllPositions();
        return ApiResponse.<List<PositionResponse>>builder()
                .code(200)
                .message("Get all positions successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy positions theo trang
     * GET /api/positions/pagination
     */
    @GetMapping("/pagination")
    public ApiResponse<Page<PositionResponse>> getPositionsPaginated(Pageable pageable) {
        log.info("REST request to get positions with pagination");
        Page<PositionResponse> responses = positionService.getPositionsPaginated(pageable);
        return ApiResponse.<Page<PositionResponse>>builder()
                .code(200)
                .message("Get positions with pagination successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy position theo ID
     * GET /api/positions/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<PositionResponse> getPositionById(@PathVariable String id) {
        log.info("REST request to get position with id: {}", id);
        PositionResponse response = positionService.getPositionById(id);
        return ApiResponse.<PositionResponse>builder()
                .code(200)
                .message("Get position successful")
                .data(response)
                .build();
    }

    /**
     * Tạo position mới
     * POST /api/positions
     */
    @PostMapping
    public ApiResponse<PositionResponse> createPosition(@RequestBody PositionRequest request) {
        log.info("REST request to create position: {}", request.getPositionName());
        
        PositionResponse response = positionService.createPosition(request);
        return ApiResponse.<PositionResponse>builder()
                .code(201)
                .message("Position created successful")
                .data(response)
                .build();
    }

    /**
     * Cập nhật position
     * PUT /api/positions/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<PositionResponse> updatePosition(
            @PathVariable String id,
            @RequestBody PositionRequest request) {
        log.info("REST request to update position with id: {}", id);
        
        PositionResponse response = positionService.updatePosition(id, request);
        return ApiResponse.<PositionResponse>builder()
                .code(200)
                .message("Position updated successful")
                .data(response)
                .build();
    }

    /**
     * Xóa position
     * DELETE /api/positions/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePosition(@PathVariable String id) {
        log.info("REST request to delete position with id: {}", id);
        positionService.deletePosition(id);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Position deleted successful")
                .build();
    }

    /**
     * Batch create positions
     * POST /api/positions/batch/create
     */
    @PostMapping("/batch/create")
    public ApiResponse<List<PositionResponse>> createPositionsBatch(@RequestBody List<PositionRequest> requests) {
        log.info("REST request to create {} positions in batch", requests.size());
        
        List<PositionResponse> responses = positionService.createPositionsBatch(requests);
        return ApiResponse.<List<PositionResponse>>builder()
                .code(201)
                .message("Batch create positions successful: " + responses.size() + " positions created")
                .data(responses)
                .build();
    }

    /**
     * Batch update positions
     * PUT /api/positions/batch/update
     */
    @PutMapping("/batch/update")
    public ApiResponse<List<PositionResponse>> updatePositionsBatch(@RequestBody List<PositionUpdateRequest> requests) {
        log.info("REST request to update {} positions in batch", requests.size());
        List<PositionResponse> responses = positionService.updatePositionsBatch(requests);
        return ApiResponse.<List<PositionResponse>>builder()
                .code(200)
                .message("Batch update positions successful: " + responses.size() + " positions updated")
                .data(responses)
                .build();
    }

    /**
     * Batch delete positions
     * DELETE /api/positions/batch/delete
     */
    @DeleteMapping("/batch/delete")
    public ApiResponse<Void> deletePositionsBatch(@RequestBody List<String> ids) {
        log.info("REST request to delete {} positions in batch", ids.size());
        positionService.deletePositionsBatch(ids);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Batch delete positions successful: " + ids.size() + " positions deleted")
                .build();
    }
}

