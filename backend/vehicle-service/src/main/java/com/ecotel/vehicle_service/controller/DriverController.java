package com.ecotel.vehicle_service.controller;

import com.ecotel.vehicle_service.dto.response.ApiResponse;
import com.ecotel.vehicle_service.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController {
    private final DriverService driverService;

    // GET DRIVER NAME BY ID
    @GetMapping("/name/{driverId}")
    public ApiResponse<String> getDriverNameById(@PathVariable String driverId) {
        String driverName = driverService.getDriverNameById(driverId);
        return ApiResponse.<String>builder()
                .message("Driver name retrieved successfully")
                .data(driverName)
                .build();
    }
}
