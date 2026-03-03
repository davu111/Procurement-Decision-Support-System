package com.ecotel.vehicle_service.controller;

import com.ecotel.vehicle_service.dto.request.VehicleRequest;
import com.ecotel.vehicle_service.dto.response.ApiResponse;
import com.ecotel.vehicle_service.dto.response.VehicleResponse;
import com.ecotel.vehicle_service.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService vehicleService;

    // GET ALL VEHICLES
    @GetMapping
    public ApiResponse<List<VehicleResponse>> getAllVehicles() {
        List<VehicleResponse> vehicleResponseList = vehicleService.getAll();
        return ApiResponse.<List<VehicleResponse>>builder()
                .message("Vehicles retrieved successfully")
                .data(vehicleResponseList)
                .build();
    }

    // GET VEHICLE BY ID
    @GetMapping("/{id}")
    public ApiResponse<VehicleResponse> getVehicleById(String id) {
        VehicleResponse vehicleResponse = vehicleService.getById(id);
        return ApiResponse.<VehicleResponse>builder()
                .message("Vehicle retrieved successfully")
                .data(vehicleResponse)
                .build();
    }

    // GET VEHICLE BY LICENSE PLATE
    @GetMapping("/license-plate/{licensePlate}")
    public ApiResponse<VehicleResponse> getVehicleByLicensePlate(@PathVariable String licensePlate) {
        VehicleResponse vehicleResponse = vehicleService.getByLicensePlate(licensePlate);
        return ApiResponse.<VehicleResponse>builder()
                .message("Vehicle retrieved successfully")
                .data(vehicleResponse)
                .build();
    }

    // CREATE VEHICLE
    @PostMapping("/create")
    public ApiResponse<VehicleResponse> createVehicle(@RequestBody VehicleRequest request) {
        VehicleResponse vehicleResponse = vehicleService.createVehicle(request);
        return ApiResponse.<VehicleResponse>builder()
                .message("Vehicle created successfully")
                .data(vehicleResponse)
                .build();
    }

    // CREATE VEHICLE BATCH
    @PostMapping("/create-batch")
    public ApiResponse<List<VehicleResponse>> createVehicleBatch(@RequestBody List<VehicleRequest> request) {
        List<VehicleResponse> vehicleResponses = vehicleService.createVehicleBatch(request);
        return ApiResponse.<List<VehicleResponse>>builder()
                .message("Vehicle batch created successfully")
                .data(vehicleResponses)
                .build();
    }

    // UPDATE VEHICLE
    @PutMapping("/update/{id}")
    public ApiResponse<VehicleResponse> updateVehicle(@PathVariable String id, @RequestBody VehicleRequest request) {
        VehicleResponse vehicleResponse = vehicleService.updateVehicle(id, request);
        return ApiResponse.<VehicleResponse>builder()
                .message("Vehicle updated successfully")
                .data(vehicleResponse)
                .build();
    }

    // DELETE VEHICLE
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteVehicle(@PathVariable String id) {
        vehicleService.deleteVehicle(id);
        return ApiResponse.<Void>builder()
                .message("Vehicle deleted successfully")
                .build();
    }
}
