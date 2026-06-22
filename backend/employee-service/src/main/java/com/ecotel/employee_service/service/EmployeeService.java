package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.enums.EmployeeStatus;
import com.ecotel.employee_service.mapper.EmployeeMapper;
import com.ecotel.employee_service.model.Employee;
import com.ecotel.employee_service.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    private final EmployeeMapper employeeMapper;

    private final KeycloakService keycloakService;

    // Keycloak-only methods removed. All get/update/create operations return combined DB + Keycloak data.

    /**
     * Lấy employee kết hợp (DB + Keycloak)
     */
    public EmployeeResponse getEmployeeFromDatabase(String userId) {
        Employee employee = employeeRepository.findById(userId)
                .or(() -> employeeRepository.findByKeycloakUserId(userId))
                .orElseThrow(() -> new RuntimeException("Employee not found in database: " + userId));

        return mapToCombinedEmployeeResponse(employee);
    }

    public String getFullNameById(String userId) {
        Employee employee = employeeRepository.findById(userId)
                .or(() -> employeeRepository.findByKeycloakUserId(userId))
                .orElseThrow(() -> new RuntimeException("Employee not found in database: " + userId));
        UserRepresentation user = keycloakService.getUserById(employee.getKeycloakUserId());
        return user.getFirstName() + " " + user.getLastName();
    }

    /**
     * Lấy tất cả employees từ database
     */
    public List<EmployeeResponse> getAllEmployeesFromDatabase() {
        return employeeRepository.findAll().stream()
                .map(this::mapToCombinedEmployeeResponse)
                .collect(Collectors.toList());
    }

    /**
     * Batch create employees
     */
    @Transactional
    public List<EmployeeResponse> createEmployeesBatch(List<EmployeeRequest> requests) {
        List<EmployeeResponse> created = new java.util.ArrayList<>();
        for (EmployeeRequest req : requests) {
            try {
                created.add(createEmployee(req));
            } catch (Exception e) {
                log.warn("Batch create: failed for {}: {}", req.getUsername(), e.getMessage());
            }
        }
        return created;
    }

    /**
     * Batch update employees
     */
    @Transactional
    public List<EmployeeResponse> updateEmployeesBatch(List<com.ecotel.employee_service.dto.request.EmployeeUpdateRequest> updates) {
        List<EmployeeResponse> updated = new java.util.ArrayList<>();
        for (com.ecotel.employee_service.dto.request.EmployeeUpdateRequest u : updates) {
            try {
                EmployeeResponse resp = updateEmployee(u.getId(), new EmployeeRequest(
                        u.getFirstName(), u.getLastName(), u.getUsername(), u.getRoleName(), u.getStatus()
                ));
                updated.add(resp);
            } catch (Exception e) {
                log.warn("Batch update: failed for id {}: {}", u.getId(), e.getMessage());
            }
        }
        return updated;
    }

    /**
     * Tạo employee mới đồng thời trong Database và Keycloak
     */
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating new employee with username: {}", request.getUsername());

        String keycloakUserId = null;
        String initialPassword = null;

        try {
            // 3. Tạo user trong Keycloak (generate password)
            initialPassword = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 12);
            keycloakUserId = createUserInKeycloak(request, request.getRoleName(), initialPassword);

            // 4. Tạo employee entity với Keycloak ID
            Employee employee = employeeMapper.toEntity(request);
            employee.setKeycloakUserId(keycloakUserId); // Sử dụng Keycloak User ID
            employee.setRoleName(request.getRoleName());

            // 5. Lưu vào database
            Employee savedEmployee = employeeRepository.save(employee);

            log.info("Successfully created employee {} with Keycloak ID: {}",
                    request.getUsername(), keycloakUserId);

            // 6. Return response (include initial password so UI can show it once)
            EmployeeResponse resp = mapToCombinedEmployeeResponse(savedEmployee);
            resp.setInitialPassword(initialPassword);
            return resp;

        } catch (Exception e) {
            // Rollback: Xóa user khỏi Keycloak nếu có lỗi khi lưu vào database
            if (keycloakUserId != null) {
                try {
                    log.warn("Rolling back Keycloak user creation for: {}", request.getUsername());
                    keycloakService.deleteUser(keycloakUserId);
                } catch (Exception rollbackEx) {
                    log.error("Failed to rollback Keycloak user: {}", rollbackEx.getMessage());
                }
            }

            log.error("Error creating employee: {}", e.getMessage());
            throw new RuntimeException("Failed to create employee: " + e.getMessage(), e);
        }
    }

    /**
     * Tạo user trong Keycloak với đầy đủ thông tin
     */
    private String createUserInKeycloak(EmployeeRequest request, String roleName, String password) {
        // Parse full name to first name and last name
        String firstName = request.getFirstName();
        String lastName = request.getLastName();

        // Tạo user
        boolean enabled = request.getStatus() == EmployeeStatus.ACTIVE;
        String userId = keycloakService.createUser(
                request.getUsername(),
                password,
                firstName,
                lastName,
                enabled,
                true
        );

        // Gán role
        try {
            keycloakService.assignRoleToUser(userId, roleName);
        } catch (Exception e) {
            log.warn("Failed to assign role {} to user {}: {}",
                    roleName, userId, e.getMessage());
            // Continue without throwing exception
        }

        // Set custom attributes
        Map<String, List<String>> attributes = new HashMap<>();

        keycloakService.setUserAttributes(userId, attributes);

        return userId;
    }

    /**
     * Update employee (cả database và Keycloak)
     */
    @Transactional
    public EmployeeResponse updateEmployee(String employeeId, EmployeeRequest request) {
        log.info("Updating employee: {}", employeeId);

        // 1. Tìm employee
        Employee employee = employeeRepository.findById(employeeId)
                .or(() -> employeeRepository.findByKeycloakUserId(employeeId))
                .orElseThrow(() -> new RuntimeException("Employee not found in database: " + employeeId));

        // 2. Update employee fields (roleName is stored on Employee)
        employeeMapper.updateEntityFromRequest(request, employee);
        if (request.getRoleName() != null) {
            employee.setRoleName(request.getRoleName());
        }

        // 3. Update Keycloak (username, names, roles)
        updateUserInKeycloak(employee.getKeycloakUserId(), request, employee.getRoleName());

        // 4. Save
        Employee updatedEmployee = employeeRepository.save(employee);

        log.info("Successfully updated employee: {}", employeeId);
        return mapToCombinedEmployeeResponse(updatedEmployee);
    }

    /**
     * Update user trong Keycloak
     */
    private void updateUserInKeycloak(String keycloakUserId, EmployeeRequest request, String roleName) {
        try {
            // Update role
            if (roleName != null) keycloakService.assignRoleToUser(keycloakUserId, roleName);

            // Update custom attributes
            Map<String, List<String>> attributes = new HashMap<>();

            keycloakService.setUserAttributes(keycloakUserId, attributes);

            // Update cơ bản
            keycloakService.updateUser(keycloakUserId, request);

        } catch (Exception e) {
            log.error("Failed to update user in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to update user in Keycloak", e);
        }
    }

    /**
     * DeActive employee
     */
    public Boolean deActive(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Can not find employeeId to de active" + id));
        employee.setStatus(EmployeeStatus.INACTIVE);
        employeeRepository.save(employee);
        return true;
    }

    /**
     * Active employee
     */
    public Boolean active(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Can not find employeeId to de active" + id));
        employee.setStatus(EmployeeStatus.ACTIVE);
        employeeRepository.save(employee);
        return true;
    }

    /**
     * Delete employee (cả database và Keycloak)
     */
    @Transactional
    public void deleteEmployee(String employeeId) {
        log.info("Deleting employee: {}", employeeId);

        // 1. Tìm employee
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        try {
            // 2. Xóa khỏi database
            employeeRepository.delete(employee);

            // 3. Xóa khỏi Keycloak
            keycloakService.deleteUser(employee.getKeycloakUserId());

            log.info("Successfully deleted employee: {}", employeeId);

        } catch (Exception e) {
            log.error("Error deleting employee: {}", e.getMessage());
            throw new RuntimeException("Failed to delete employee", e);
        }
    }

    /**
     * Map combined Employee entity + Keycloak user into EmployeeResponse
     */
    private EmployeeResponse mapToCombinedEmployeeResponse(Employee employee) {
        EmployeeResponse.EmployeeResponseBuilder builder = EmployeeResponse.builder()
                .id(employee.getId())
                .keycloakUserId(employee.getKeycloakUserId())
                .roleName(employee.getRoleName())
                .status(employee.getStatus());

        try {
            if (employee.getKeycloakUserId() != null) {
                UserRepresentation u = keycloakService.getUserById(employee.getKeycloakUserId());
                builder.username(u.getUsername())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Keycloak user for employee {}: {}", employee.getId(), e.getMessage());
        }

        return builder.build();
    }
}
