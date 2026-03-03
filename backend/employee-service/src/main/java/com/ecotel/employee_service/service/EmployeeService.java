package com.ecotel.employee_service.service;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.enums.EmployeeStatus;
import com.ecotel.employee_service.mapper.EmployeeMapper;
import com.ecotel.employee_service.model.Department;
import com.ecotel.employee_service.model.Employee;
import com.ecotel.employee_service.model.Position;
import com.ecotel.employee_service.model.Role;
import com.ecotel.employee_service.repository.DepartmentRepository;
import com.ecotel.employee_service.repository.EmployeeRepository;
import com.ecotel.employee_service.repository.PositionRepository;
import com.ecotel.employee_service.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    private final EmployeeMapper employeeMapper;

    private final KeycloakService keycloakService;

    /**
     * Lấy tất cả employees từ Keycloak (chưa sync với DB)
     */
    public List<EmployeeResponse> getAllEmployeesFromKeycloak() {
        log.info("Fetching all users from Keycloak");

        List<UserRepresentation> keycloakUsers = keycloakService.getAllUsers();

        return keycloakUsers.stream()
                .map(this::mapToEmployeeResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy employee theo ID từ Keycloak
     */
    public EmployeeResponse getEmployeeFromKeycloak(String userId) {
        log.info("Fetching user {} from Keycloak", userId);

        UserRepresentation keycloakUser = keycloakService.getUserById(userId);
        return mapToEmployeeResponse(keycloakUser);
    }

    /**
     * Lấy employee theo username từ Keycloak
     */
    public EmployeeResponse getEmployeeByUsername(String username) {
        log.info("Fetching user {} from Keycloak", username);

        UserRepresentation keycloakUser = keycloakService.getUserByUsername(username);
        return mapToEmployeeResponse(keycloakUser);
    }

    /**
     * Đồng bộ một employee từ Keycloak vào database
     */
    @Transactional
    public Employee syncEmployeeFromKeycloak(String userId) {
        log.info("Syncing employee {} from Keycloak to database", userId);

        UserRepresentation keycloakUser = keycloakService.getUserById(userId);

        Employee employee = employeeRepository.findById(userId)
                .orElse(new Employee());

        // Map dữ liệu từ Keycloak
        employee.setId(keycloakUser.getId());
        employee.setUsername(keycloakUser.getUsername());

        employee.setFirstName(keycloakUser.getFirstName());
        employee.setLastName(keycloakUser.getLastName());

        // Lấy custom attributes từ Keycloak
        employee.setSiteId(keycloakService.getUserAttribute(keycloakUser, "site_id"));
//        employee.setPositionId(keycloakService.getUserAttribute(keycloakUser, "position_id"));
//        employee.setDepartmentId(keycloakService.getUserAttribute(keycloakUser, "department_id"));

        String ppeFlag = keycloakService.getUserAttribute(keycloakUser, "ppe_compliant_flag");
        employee.setPpeCompliantFlag(ppeFlag != null ? Boolean.valueOf(ppeFlag) : false);

        String warehouseFlag = keycloakService.getUserAttribute(keycloakUser, "in_warehouse_flag");
        employee.setInWarehouseFlag(warehouseFlag != null ? Boolean.valueOf(warehouseFlag) : false);

        // Set default status nếu chưa có
        if (employee.getStatus() == null) {
            employee.setStatus(keycloakUser.isEnabled() ?
                    EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE);
        }

        return employeeRepository.save(employee);
    }

    /**
     * Đồng bộ tất cả employees từ Keycloak vào database
     */
    @Transactional
    public List<Employee> syncAllEmployeesFromKeycloak() {
        log.info("Syncing all employees from Keycloak to database");

        List<UserRepresentation> keycloakUsers = keycloakService.getAllUsers();

        return keycloakUsers.stream()
                .map(user -> syncEmployeeFromKeycloak(user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Lấy employee từ database (đã sync)
     */
    public EmployeeResponse getEmployeeFromDatabase(String userId) {
        Employee employee = employeeRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found in database: " + userId));
        return employeeMapper.toResponse(employee);
    }

    /**
     * Lấy tất cả employees từ database
     */
    public List<EmployeeResponse> getAllEmployeesFromDatabase() {
        return employeeRepository.findAll().stream()
                .map(employeeMapper::toResponse)
                .collect(Collectors.toList());
    }

    // GET EMPLOYEE NAME BY ID
    public String getUsernameById(String employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found in database: " + employeeId));
        return employee.getFirstName() + " " + employee.getLastName();
    }

    // GET EMPLOYEE BY ID CARD
    public EmployeeResponse getEmployeeByIdCard(String idCard) {
        Employee employee = employeeRepository.findByIdCard(idCard)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID Card: " + idCard));
        return employeeMapper.toResponse(employee);
    }

    /**
     * Tạo employee mới đồng thời trong Database và Keycloak
     */
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        log.info("Creating new employee with username: {}", request.getUsername());

        // 1. Validate: Kiểm tra username đã tồn tại chưa
        if (employeeRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }

        // 2. Validate: Kiểm tra role, position, department có tồn tại không
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRoleId()));

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new RuntimeException("Position not found: " + request.getPositionId()));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found: " + request.getDepartmentId()));

        String keycloakUserId = null;

        try {
            // 3. Tạo user trong Keycloak
            keycloakUserId = createUserInKeycloak(request, role.getRoleName());
            System.out.println(keycloakUserId);

            // 4. Tạo employee entity với Keycloak ID
            Employee employee = employeeMapper.toEntity(request, role, position, department);
            employee.setKeycloakUserId(keycloakUserId); // Sử dụng Keycloak User ID
            employee.setPasswordHash(request.getUsername()); // default password = username

            // 5. Lưu vào database
            Employee savedEmployee = employeeRepository.save(employee);

            log.info("Successfully created employee {} with Keycloak ID: {}",
                    request.getUsername(), keycloakUserId);

            // 6. Return response
            return employeeMapper.toResponse(savedEmployee);

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
    private String createUserInKeycloak(EmployeeRequest request, String roleName) {
        // Parse full name to first name and last name
        String firstName = request.getFirstName();
        String lastName = request.getLastName();

        // Tạo user
        boolean enabled = request.getStatus() == EmployeeStatus.ACTIVE;
        String userId = keycloakService.createUser(
                request.getUsername(),
                request.getUsername(), // default password = username
                firstName,
                lastName,
                enabled
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
        attributes.put("site_id", Collections.singletonList(request.getSiteId()));
        attributes.put("position_id", Collections.singletonList(request.getPositionId()));
        attributes.put("department_id", Collections.singletonList(request.getDepartmentId()));
        attributes.put("ppe_compliant_flag", Collections.singletonList(
                String.valueOf(request.getPpeCompliantFlag())));
        attributes.put("in_warehouse_flag", Collections.singletonList(
                String.valueOf(request.getInWarehouseFlag())));

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
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        // 2. Validate references
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRoleId()));

        Position position = positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new RuntimeException("Position not found: " + request.getPositionId()));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found: " + request.getDepartmentId()));

        // 3. Update employee
        employeeMapper.updateEntityFromRequest(request, employee, role, position, department);

        // 4. Update Keycloak
        updateUserInKeycloak(employee.getKeycloakUserId(), request, role.getRoleName());

        // 5. Save
        Employee updatedEmployee = employeeRepository.save(employee);

        log.info("Successfully updated employee: {}", employeeId);
        return employeeMapper.toResponse(updatedEmployee);
    }

    /**
     * Update user trong Keycloak
     */
    private void updateUserInKeycloak(String keycloakUserId, EmployeeRequest request, String roleName) {
        try {
            // Update role
            keycloakService.assignRoleToUser(keycloakUserId, roleName);

            // Update custom attributes
            Map<String, List<String>> attributes = new HashMap<>();
            attributes.put("site_id", Collections.singletonList(request.getSiteId()));
            attributes.put("position_id", Collections.singletonList(request.getPositionId()));
            attributes.put("department_id", Collections.singletonList(request.getDepartmentId()));
            attributes.put("ppe_compliant_flag", Collections.singletonList(
                    String.valueOf(request.getPpeCompliantFlag())));
            attributes.put("in_warehouse_flag", Collections.singletonList(
                    String.valueOf(request.getInWarehouseFlag())));

            keycloakService.setUserAttributes(keycloakUserId, attributes);

            // Update cơ bản
            keycloakService.updateUser(keycloakUserId, request);

        } catch (Exception e) {
            log.error("Failed to update user in Keycloak: {}", e.getMessage());
            throw new RuntimeException("Failed to update user in Keycloak", e);
        }
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
     * Map UserRepresentation từ Keycloak sang EmployeeResponse
     */
    private EmployeeResponse mapToEmployeeResponse(UserRepresentation keycloakUser) {
        List<String> roles = keycloakService.getUserRoles(keycloakUser.getId());

        return EmployeeResponse.builder()
                .id(keycloakUser.getId())
                .username(keycloakUser.getUsername())
                .firstName(keycloakUser.getFirstName())
                .lastName(keycloakUser.getLastName())
                .siteId(keycloakService.getUserAttribute(keycloakUser, "site_id"))
                .positionId(keycloakService.getUserAttribute(keycloakUser, "position_id"))
                .departmentId(keycloakService.getUserAttribute(keycloakUser, "department_id"))
                .ppeCompliantFlag(getBooleanAttribute(keycloakUser, "ppe_compliant_flag"))
                .inWarehouseFlag(getBooleanAttribute(keycloakUser, "in_warehouse_flag"))
                .build();
    }

    private Boolean getBooleanAttribute(UserRepresentation user, String attributeName) {
        String value = keycloakService.getUserAttribute(user, attributeName);
        return value != null ? Boolean.valueOf(value) : null;
    }
}
