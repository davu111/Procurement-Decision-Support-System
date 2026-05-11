package com.ecotel.employee_service.controller;

import com.ecotel.employee_service.dto.request.EmployeeRequest;
import com.ecotel.employee_service.dto.request.EmployeeUpdateRequest;
import com.ecotel.employee_service.dto.response.EmployeeResponse;
import com.ecotel.employee_service.service.EmployeeService;
import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;

    // Keycloak-only endpoints removed. Use unified endpoints below (DB + Keycloak combined).

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


    // CREATE USER
    @PostMapping("/create")
    public ApiResponse<EmployeeResponse> createUser(@RequestBody EmployeeRequest request){
        EmployeeResponse response = employeeService.createEmployee(request);
        return ApiResponse.<EmployeeResponse>builder()
                .message("Create User successful")
                .data(response)
                .build();
    }

    // Batch create
    @PostMapping("/batch/create")
    public ApiResponse<List<EmployeeResponse>> createUsersBatch(@RequestBody List<EmployeeRequest> requests){
        List<EmployeeResponse> responses = employeeService.createEmployeesBatch(requests);
        return ApiResponse.<List<EmployeeResponse>>builder()
                .message("Batch create users completed: " + responses.size())
                .data(responses)
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

    // Batch update
    @PutMapping("/batch/update")
    public ApiResponse<List<EmployeeResponse>> updateUsersBatch(@RequestBody List<EmployeeUpdateRequest> requests){
        List<EmployeeResponse> responses = employeeService.updateEmployeesBatch(requests);
        return ApiResponse.<List<EmployeeResponse>>builder()
                .message("Batch update users completed: " + responses.size())
                .data(responses)
                .build();
    }

    // INACTIVE USER
    @PatchMapping("/de-active/{userId}")
    public ApiResponse<Boolean> deActiveUser(@PathVariable String userId){
        return ApiResponse.<Boolean>builder()
                .message("DeActive user successful")
                .data(employeeService.deActive(userId))
                .build();
    }

    // ACTIVE USER
    @PatchMapping("/active/{userId}")
    public ApiResponse<Boolean> activeUser(@PathVariable String userId){
        return ApiResponse.<Boolean>builder()
                .message("Active user successful")
                .data(employeeService.active(userId))
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
