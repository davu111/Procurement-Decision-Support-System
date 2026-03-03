package com.ecotel.employee_service.controller;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.response.ApiResponse;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.model.Employee;
import com.ecotel.employee_service.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;

    /**
     * Lấy tất cả users từ Keycloak (chưa sync vào DB)
     * GET /api/employees/keycloak
     */
    @GetMapping("/keycloak")
    public ApiResponse<List<EmployeeResponse>> getAllFromKeycloak() {
        log.info("REST request to get all employees from Keycloak");
        List<EmployeeResponse> employees = employeeService.getAllEmployeesFromKeycloak();
        return ApiResponse.<List<EmployeeResponse>>builder()
                .message("Get all employees from Keycloak successful")
                .data(employees)
                .build();
    }

    /**
     * Lấy user theo ID từ Keycloak
     * GET /api/employees/keycloak/{userId}
     */
    @GetMapping("/keycloak/{userId}")
    public ApiResponse<EmployeeResponse> getFromKeycloak(@PathVariable String userId) {
        log.info("REST request to get employee {} from Keycloak", userId);
        EmployeeResponse employee = employeeService.getEmployeeFromKeycloak(userId);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Get employee from Keycloak successful")
                .data(employee)
                .build();
    }

    /**
     * Lấy user theo username từ Keycloak
     * GET /api/employees/keycloak/username/{username}
     */
    @GetMapping("/keycloak/username/{username}")
    public ApiResponse<EmployeeResponse> getByUsername(@PathVariable String username) {
        log.info("REST request to get employee by username {} from Keycloak", username);
        EmployeeResponse employee = employeeService.getEmployeeByUsername(username);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Get employee by username from Keycloak successful")
                .data(employee)
                .build();
    }

//    /**
//     * Đồng bộ một employee từ Keycloak vào database
//     * POST /api/employees/sync/{userId}
//     */
//    @PostMapping("/sync/{userId}")
//    public ResponseEntity<Employee> syncEmployee(@PathVariable String userId) {
//        log.info("REST request to sync employee {} from Keycloak", userId);
//        Employee employee = employeeService.syncEmployeeFromKeycloak(userId);
//        return ResponseEntity.ok(employee);
//    }
//
//    /**
//     * Đồng bộ tất cả employees từ Keycloak vào database
//     * POST /api/employees/sync-all
//     */
//    @PostMapping("/sync-all")
//    public ResponseEntity<List<Employee>> syncAllEmployees() {
//        log.info("REST request to sync all employees from Keycloak");
//        List<Employee> employees = employeeService.syncAllEmployeesFromKeycloak();
//        return ResponseEntity.ok(employees);
//    }

    /**
     * Lấy tất cả employees từ database (đã sync)
     * GET /api/employees
     */
    @GetMapping
    public ApiResponse<List<EmployeeResponse>> getAllFromDatabase() {
        log.info("REST request to get all employees from database");
        List<EmployeeResponse> employees = employeeService.getAllEmployeesFromDatabase();
        return ApiResponse.<List<EmployeeResponse>>builder()
                .message("Get all employees from database successful")
                .data(employees)
                .build();
    }

    /**
     * Lấy employee theo ID từ database
     * GET /api/employees/{userId}
     */
    @GetMapping("/{userId}")
    public ApiResponse<EmployeeResponse> getFromDatabase(@PathVariable String userId) {
        log.info("REST request to get employee {} from database", userId);
        EmployeeResponse employee = employeeService.getEmployeeFromDatabase(userId);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Get employee from database successful")
                .data(employee)
                .build();
    }

    // GET USERNAME BY ID
    @GetMapping("/username/{userId}")
    public ApiResponse<String> getUsernameById(@PathVariable String userId) {
        String username = employeeService.getUsernameById(userId);
        return ApiResponse.<String>builder()
                .message("Get username by ID successful")
                .data(username)
                .build();
    }

    // GET EMPLOYEE BY ID CARD
    @GetMapping("/id-card/{idCard}")
    public ApiResponse<EmployeeResponse> getEmployeeByIdCard(@PathVariable String idCard) {
        EmployeeResponse employee = employeeService.getEmployeeByIdCard(idCard);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Get employee by ID Card successful")
                .data(employee)
                .build();
    }

    // CREATE USER
    @PostMapping("/create")
    public ApiResponse<EmployeeResponse> createUser(@RequestBody EmployeeRequest request){
        EmployeeResponse response = employeeService.createEmployee(request);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Create User successful")
                .data(response)
                .build();
    }

    // UPDATE USER
    @PutMapping("/update/{userId}")
    public ApiResponse<EmployeeResponse> updateUser(@PathVariable String userId, @RequestBody EmployeeRequest request){
        EmployeeResponse response = employeeService.updateEmployee(userId, request);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Update User successful")
                .data(response)
                .build();
    }

    // DELETE USER
    @DeleteMapping("/delete/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable String userId) {
        employeeService.deleteEmployee(userId);
        return ApiResponse.<Void>builder()
                .message("Delete User successful")
                .build();
    }
}
