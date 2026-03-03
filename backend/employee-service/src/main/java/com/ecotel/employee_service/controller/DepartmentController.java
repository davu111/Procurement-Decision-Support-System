package com.ecotel.employee_service.controller;

import com.ecotel.employee_service.dto.request.DepartmentRequest;
import com.ecotel.employee_service.dto.request.DepartmentUpdateRequest;
import com.ecotel.employee_service.dto.response.ApiResponse;
import com.ecotel.employee_service.dto.response.DepartmentResponse;
import com.ecotel.employee_service.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Slf4j
public class DepartmentController {

    private final DepartmentService departmentService;

    /**
     * Lấy tất cả departments
     * GET /api/departments
     */
    @GetMapping
    public ApiResponse<List<DepartmentResponse>> getAllDepartments() {
        log.info("REST request to get all departments");
        List<DepartmentResponse> responses = departmentService.getAllDepartments();
        return ApiResponse.<List<DepartmentResponse>>builder()
                .message("Get all departments successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy departments theo trang
     * GET /api/departments/pagination
     */
    @GetMapping("/pagination")
    public ApiResponse<Page<DepartmentResponse>> getDepartmentsPaginated(Pageable pageable) {
        log.info("REST request to get departments with pagination");
        Page<DepartmentResponse> responses = departmentService.getDepartmentsPaginated(pageable);
        return ApiResponse.<Page<DepartmentResponse>>builder()
                .message("Get departments with pagination successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy department theo ID
     * GET /api/departments/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<DepartmentResponse> getDepartmentById(@PathVariable String id) {
        log.info("REST request to get department with id: {}", id);
        DepartmentResponse response = departmentService.getDepartmentById(id);
        return ApiResponse.<DepartmentResponse>builder()
                .message("Get department successful")
                .data(response)
                .build();
    }

    /**
     * Tạo department mới
     * POST /api/departments
     */
    @PostMapping
    public ApiResponse<DepartmentResponse> createDepartment(@RequestBody DepartmentRequest request) {
        log.info("REST request to create department: {}", request.getDepartmentName());

        DepartmentResponse response = departmentService.createDepartment(request);
        return ApiResponse.<DepartmentResponse>builder()
                .message("Department created successful")
                .data(response)
                .build();
    }

    /**
     * Cập nhật department
     * PUT /api/departments/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<DepartmentResponse> updateDepartment(
            @PathVariable String id,
            @RequestBody DepartmentRequest request) {
        log.info("REST request to update department with id: {}", id);

        DepartmentResponse response = departmentService.updateDepartment(id, request);
        return ApiResponse.<DepartmentResponse>builder()
                .message("Department updated successful")
                .data(response)
                .build();
    }

    /**
     * Xóa department
     * DELETE /api/departments/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDepartment(@PathVariable String id) {
        log.info("REST request to delete department with id: {}", id);
        departmentService.deleteDepartment(id);
        return ApiResponse.<Void>builder()
                .message("Department deleted successful")
                .build();
    }

    /**
     * Batch create departments
     * POST /api/departments/batch/create
     */
    @PostMapping("/batch/create")
    public ApiResponse<List<DepartmentResponse>> createDepartmentsBatch(@RequestBody List<DepartmentRequest> requests) {
        log.info("REST request to create {} departments in batch", requests.size());

        List<DepartmentResponse> responses = departmentService.createDepartmentsBatch(requests);
        return ApiResponse.<List<DepartmentResponse>>builder()
                .message("Batch create departments successful: " + responses.size() + " departments created")
                .data(responses)
                .build();
    }

    /**
     * Batch update departments
     * PUT /api/departments/batch/update
     */
    @PutMapping("/batch/update")
    public ApiResponse<List<DepartmentResponse>> updateDepartmentsBatch(@RequestBody List<DepartmentUpdateRequest> requests) {
        log.info("REST request to update {} departments in batch", requests.size());
        List<DepartmentResponse> responses = departmentService.updateDepartmentsBatch(requests);
        return ApiResponse.<List<DepartmentResponse>>builder()
                .message("Batch update departments successful: " + responses.size() + " departments updated")
                .data(responses)
                .build();
    }

    /**
     * Batch delete departments
     * DELETE /api/departments/batch/delete
     */
    @DeleteMapping("/batch/delete")
    public ApiResponse<Void> deleteDepartmentsBatch(@RequestBody List<String> ids) {
        log.info("REST request to delete {} departments in batch", ids.size());
        departmentService.deleteDepartmentsBatch(ids);
        return ApiResponse.<Void>builder()
                .message("Batch delete departments successful: " + ids.size() + " departments deleted")
                .build();
    }
}
