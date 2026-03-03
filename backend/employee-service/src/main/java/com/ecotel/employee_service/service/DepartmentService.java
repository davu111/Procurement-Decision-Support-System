package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.DepartmentRequest;
import com.ecotel.employee_service.dto.request.DepartmentUpdateRequest;
import com.ecotel.employee_service.dto.response.DepartmentResponse;
import com.ecotel.employee_service.mapper.DepartmentMapper;
import com.ecotel.employee_service.model.Department;
import com.ecotel.employee_service.repository.DepartmentRepository;
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
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    /**
     * Lấy tất cả departments
     */
    public List<DepartmentResponse> getAllDepartments() {
        log.info("Fetching all departments");
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .toList();
    }

    /**
     * Lấy departments theo trang
     */
    public Page<DepartmentResponse> getDepartmentsPaginated(Pageable pageable) {
        log.info("Fetching departments with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        return departmentRepository.findAll(pageable)
                .map(departmentMapper::toResponse);
    }

    /**
     * Lấy department theo ID
     */
    public DepartmentResponse getDepartmentById(String id) {
        log.info("Fetching department with id: {}", id);
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        return departmentMapper.toResponse(department);
    }

    /**
     * Tạo department mới
     */
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest departmentRequest) {
        log.info("Creating new department: {}", departmentRequest.getDepartmentName());

        try {
            Department department = departmentMapper.toEntity(departmentRequest);
            Department savedDepartment = departmentRepository.save(department);
            log.info("Department created with id: {}", savedDepartment.getId());
            return departmentMapper.toResponse(savedDepartment);
        } catch (Exception e) {
            log.error("Error creating department: {}", e.getMessage());
            throw new RuntimeException("Failed to create department", e);
        }
    }

    /**
     * Cập nhật department
     */
    @Transactional
    public DepartmentResponse updateDepartment(String id, DepartmentRequest departmentRequest) {
        log.info("Updating department with id: {}", id);

        try {
            Department department = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));

            departmentMapper.updateEntityFromRequest(departmentRequest, department);

            Department updatedDepartment = departmentRepository.save(department);
            log.info("Department updated: {}", id);

            return departmentMapper.toResponse(updatedDepartment);
        } catch (Exception e) {
            log.error("Error updating department: {}", e.getMessage());
            throw new RuntimeException("Failed to update department", e);
        }
    }

    /**
     * Xóa department
     */
    @Transactional
    public void deleteDepartment(String id) {
        log.info("Deleting department with id: {}", id);

        try {
            Department department = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
            departmentRepository.deleteById(id);
            log.info("Department deleted: {} ({})", department.getDepartmentName(), id);
        } catch (Exception e) {
            log.error("Error deleting department: {}", e.getMessage());
            throw new RuntimeException("Failed to delete department", e);
        }
    }

    /**
     * Batch create departments
     * Tạo nhiều departments cùng lúc
     */
    @Transactional
    public List<DepartmentResponse> createDepartmentsBatch(List<DepartmentRequest> departments) {
        log.info("Creating {} departments in batch", departments.size());

        try {
            List<DepartmentResponse> savedDepartments = new ArrayList<>();

            for (DepartmentRequest departmentRequest : departments) {
                try {
                    Department department = departmentMapper.toEntity(departmentRequest);

                    Department savedDepartment = departmentRepository.save(department);
                    savedDepartments.add(departmentMapper.toResponse(savedDepartment));
                    log.info("Batch: Department created - {} ({})", department.getDepartmentName(), savedDepartment.getId());
                } catch (Exception e) {
                    log.warn("Batch: Failed to create department {}: {}", departmentRequest.getDepartmentName(), e.getMessage());
                    // Tiếp tục với department tiếp theo
                }
            }

            log.info("Batch creation completed: {} departments created successfully", savedDepartments.size());
            return savedDepartments;
        } catch (Exception e) {
            log.error("Error in batch creation: {}", e.getMessage());
            throw new RuntimeException("Failed to create departments in batch", e);
        }
    }

    /**
     * Batch update departments
     */
    @Transactional
    public List<DepartmentResponse> updateDepartmentsBatch(List<DepartmentUpdateRequest> departments) {
        log.info("Updating {} departments in batch", departments.size());

        try {
            List<DepartmentResponse> updatedDepartments = new ArrayList<>();

            for (DepartmentUpdateRequest departmentRequest : departments) {
                try {
                    Department department = departmentRepository.findById(departmentRequest.getId())
                            .orElseThrow(() -> new RuntimeException("Department not found with id: " + departmentRequest.getId()));

                    departmentMapper.updateEntityFromUpdateRequest(departmentRequest, department);

                    Department updatedDepartment = departmentRepository.save(department);
                    updatedDepartments.add(departmentMapper.toResponse(updatedDepartment));
                    log.info("Batch: Department updated - {}", departmentRequest.getDepartmentName());
                } catch (Exception e) {
                    log.warn("Batch: Failed to update department {}: {}", departmentRequest.getId(), e.getMessage());
                    // Tiếp tục với department tiếp theo
                }
            }

            log.info("Batch update completed: {} departments updated successfully", updatedDepartments.size());
            return updatedDepartments;
        } catch (Exception e) {
            log.error("Error in batch update: {}", e.getMessage());
            throw new RuntimeException("Failed to update departments in batch", e);
        }
    }

    /**
     * Batch delete departments
     */
    @Transactional
    public void deleteDepartmentsBatch(List<String> ids) {
        log.info("Deleting {} departments in batch", ids.size());

        try {
            for (String id : ids) {
                try {
                    Department department = departmentRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
                    departmentRepository.deleteById(id);
                    log.info("Batch: Department deleted - {} ({})", department.getDepartmentName(), id);
                } catch (Exception e) {
                    log.warn("Batch: Failed to delete department {}: {}", id, e.getMessage());
                    // Tiếp tục với department tiếp theo
                }
            }

            log.info("Batch deletion completed");
        } catch (Exception e) {
            log.error("Error in batch deletion: {}", e.getMessage());
            throw new RuntimeException("Failed to delete departments in batch", e);
        }
    }
}
