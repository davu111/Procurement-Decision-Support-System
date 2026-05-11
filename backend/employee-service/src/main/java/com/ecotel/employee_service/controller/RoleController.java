package com.ecotel.employee_service.controller;

import com.ecotel.employee_service.dto.request.RoleRequest;
import com.ecotel.employee_service.dto.request.RoleUpdateRequest;
import com.ecotel.employee_service.dto.response.RoleResponse;
import com.ecotel.employee_service.service.RoleService;
import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Slf4j
public class RoleController {

    private final RoleService roleService;

    /**
     * Lấy tất cả roles
     * GET /api/roles
     */
    @GetMapping
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        log.info("REST request to get all roles");
        List<RoleResponse> responses = roleService.getAllRoles();
        return ApiResponse.<List<RoleResponse>>builder()
                .message("Get all roles successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy roles theo trang
     * GET /api/roles/pagination
     */
    @GetMapping("/pagination")
    public ApiResponse<Page<RoleResponse>> getRolesPaginated(Pageable pageable) {
        log.info("REST request to get roles with pagination");
        Page<RoleResponse> responses = roleService.getRolesPaginated(pageable);
        return ApiResponse.<Page<RoleResponse>>builder()
                .message("Get roles with pagination successful")
                .data(responses)
                .build();
    }

    /**
     * Lấy role theo ID
     * GET /api/roles/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<RoleResponse> getRoleById(@PathVariable String id) {
        log.info("REST request to get role with id: {}", id);
        RoleResponse response = roleService.getRoleById(id);
        return ApiResponse.<RoleResponse>builder()
                .message("Get role successful")
                .data(response)
                .build();
    }

    /**
     * Tạo role mới
     * POST /api/roles
     */
    @PostMapping
    public ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest request) {
        log.info("REST request to create role: {}", request.getRoleName());
        RoleResponse response = roleService.createRole(request);
        return ApiResponse.<RoleResponse>builder()
                .message("Role created successful")
                .data(response)
                .build();
    }

    /**
     * Cập nhật role
     * PUT /api/roles/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<RoleResponse> updateRole(
            @PathVariable String id,
            @RequestBody RoleRequest request) {
        log.info("REST request to update role with id: {}", id);
        RoleResponse response = roleService.updateRole(id, request);
        return ApiResponse.<RoleResponse>builder()
                .message("Role updated successful")
                .data(response)
                .build();
    }

    /**
     * Xóa role
     * DELETE /api/roles/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable String id) {
        log.info("REST request to delete role with id: {}", id);
        roleService.deleteRole(id);
        return ApiResponse.<Void>builder()
                .message("Role deleted successful")
                .build();
    }

    /**
     * Batch create roles
     * POST /api/roles/batch/create
     */
    @PostMapping("/batch/create")
    public ApiResponse<List<RoleResponse>> createRolesBatch(@RequestBody List<RoleRequest> requests) {
        log.info("REST request to create {} roles in batch", requests.size());
        List<RoleResponse> responses = roleService.createRolesBatch(requests);
        return ApiResponse.<List<RoleResponse>>builder()
                .message("Batch create roles successful: " + responses.size() + " roles created")
                .data(responses)
                .build();
    }

    /**
     * Batch update roles
     * PUT /api/roles/batch/update
     */
    @PutMapping("/batch/update")
    public ApiResponse<List<RoleResponse>> updateRolesBatch(@RequestBody List<RoleUpdateRequest> requests) {
        log.info("REST request to update {} roles in batch", requests.size());
        List<RoleResponse> responses = roleService.updateRolesBatch(requests);
        return ApiResponse.<List<RoleResponse>>builder()
                .message("Batch update roles successful: " + responses.size() + " roles updated")
                .data(responses)
                .build();
    }

    /**
     * Batch delete roles
     * DELETE /api/roles/batch/delete
     */
    @DeleteMapping("/batch/delete")
    public ApiResponse<Void> deleteRolesBatch(@RequestBody List<String> ids) {
        log.info("REST request to delete {} roles in batch", ids.size());
        roleService.deleteRolesBatch(ids);
        return ApiResponse.<Void>builder()
                .message("Batch delete roles successful: " + ids.size() + " roles deleted")
                .build();
    }
}
