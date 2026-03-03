package com.ecotel.vehicle_service.controller;

import com.ecotel.vehicle_service.dto.request.VehicleRequest;
import com.ecotel.vehicle_service.dto.request.VehicleTypeRequest;
import com.ecotel.vehicle_service.dto.response.ApiResponse;
import com.ecotel.vehicle_service.dto.response.VehicleResponse;
import com.ecotel.vehicle_service.dto.response.VehicleTypeResponse;
import com.ecotel.vehicle_service.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle-types")
@RequiredArgsConstructor
public class VehicleTypeController {
    private final VehicleService vehicleService;

    // GET ALL VEHICLE TYPES
    @GetMapping
    public ApiResponse<List<VehicleTypeResponse>> getAllVehicleTypes() {
        List<VehicleTypeResponse> vehicleTypeResponseList = vehicleService.getAllVehicleTypes();
        return ApiResponse.<List<VehicleTypeResponse>>builder()
                .message("Vehicle types retrieved successfully")
                .data(vehicleTypeResponseList)
                .build();
    }

    // CREATE VEHICLE TYPE
    @PostMapping("/create")
    public ApiResponse<VehicleTypeResponse> createVehicleType(@RequestBody VehicleTypeRequest request) {
        VehicleTypeResponse vehicleTypeResponse = vehicleService.createVehicleType(request);
        return ApiResponse.<VehicleTypeResponse>builder()
                .message("Vehicle type created successfully")
                .data(vehicleTypeResponse)
                .build();
    }

    // CREATE VEHICLE TYPE BATCH
    @PostMapping("/create-batch")
    public ApiResponse<List<VehicleTypeResponse>> createVehicleTypeBatch(@RequestBody List<VehicleTypeRequest> request) {
        List<VehicleTypeResponse> vehicleResponses = vehicleService.createVehicleTypeBatch(request);
        return ApiResponse.<List<VehicleTypeResponse>>builder()
                .message("Vehicle type batch created successfully")
                .data(vehicleResponses)
                .build();
    }

    // UPDATE VEHICLE TYPE
    @PutMapping("/update/{id}")
    public ApiResponse<VehicleTypeResponse> updateVehicle(@PathVariable String id, @RequestBody VehicleTypeRequest request) {
        VehicleTypeResponse vehicleTypeResponse = vehicleService.updateVehicleType(id, request);
        return ApiResponse.<VehicleTypeResponse>builder()
                .message("Vehicle type updated successfully")
                .data(vehicleTypeResponse)
                .build();
    }

    // DELETE VEHICLE TYPE
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteVehicleType(@PathVariable String id) {
        vehicleService.deleteVehicleType(id);
        return ApiResponse.<Void>builder()
                .message("Vehicle type deleted successfully")
                .build();
    }
}
