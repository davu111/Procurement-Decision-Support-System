package com.ecotel.vehicle_service.controller;

import com.ecotel.vehicle_service.dto.request.VehicleRequest;
import com.ecotel.vehicle_service.dto.request.VehicleStateHistoryRequest;
import com.ecotel.vehicle_service.dto.response.ApiResponse;
import com.ecotel.vehicle_service.dto.response.VehicleResponse;
import com.ecotel.vehicle_service.dto.response.VehicleStateHistoryResponse;
import com.ecotel.vehicle_service.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle-state-histories")
@RequiredArgsConstructor
public class VehicleStateHistoryController {
    private final VehicleService vehicleService;

    // GET ALL VEHICLE STATE HISTORIES
    @GetMapping
    public ApiResponse<List<VehicleStateHistoryResponse>> getAllVehicleStateHistories() {
        List<VehicleStateHistoryResponse> vehicleStateHistoryResponseList = vehicleService.getAllVehicleStateHistories();
        return ApiResponse.<List<VehicleStateHistoryResponse>>builder()
                .message("Vehicle state histories retrieved successfully")
                .data(vehicleStateHistoryResponseList)
                .build();
    }

    // CREATE VEHICLE
    @PostMapping("/create")
    public ApiResponse<VehicleStateHistoryResponse> createVehicleStateHistory(@RequestBody VehicleStateHistoryRequest request) {
        VehicleStateHistoryResponse vehicleStateHistoryResponse = vehicleService.createVehicleStateHistory(request);
        return ApiResponse.<VehicleStateHistoryResponse>builder()
                .message("Vehicle state history created successfully")
                .data(vehicleStateHistoryResponse)
                .build();
    }

    // CREATE VEHICLE BATCH
    @PostMapping("/create-batch")
    public ApiResponse<List<VehicleStateHistoryResponse>> createVehicleStateHistoryBatch(@RequestBody List<VehicleStateHistoryRequest> request) {
        List<VehicleStateHistoryResponse> vehicleResponses = vehicleService.createVehicleStateHistoryBatch(request);
        return ApiResponse.<List<VehicleStateHistoryResponse>>builder()
                .message("Vehicle State History batch created successfully")
                .data(vehicleResponses)
                .build();
    }

    // UPDATE VEHICLE
    @PutMapping("/update/{id}")
    public ApiResponse<VehicleStateHistoryResponse> updateVehicle(@PathVariable String id, @RequestBody VehicleStateHistoryRequest request) {
        VehicleStateHistoryResponse vehicleStateHistoryResponse = vehicleService.updateVehicleStateHistory(id, request);
        return ApiResponse.<VehicleStateHistoryResponse>builder()
                .message("Vehicle updated successfully")
                .data(vehicleStateHistoryResponse)
                .build();
    }

    // DELETE VEHICLE STATE HISTORY
    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteVehicleStateHistory(@PathVariable String id) {
        vehicleService.deleteVehicleStateHistory(id);
        return ApiResponse.<Void>builder()
                .message("Vehicle state history deleted successfully")
                .build();
    }
}
