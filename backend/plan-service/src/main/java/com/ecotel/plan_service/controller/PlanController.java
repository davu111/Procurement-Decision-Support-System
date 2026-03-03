package com.ecotel.plan_service.controller;

import com.ecotel.plan_service.dto.request.FullPlanRequest;
import com.ecotel.plan_service.dto.request.FullPlanUpdateRequest;
import com.ecotel.plan_service.dto.response.ApiResponse;
import com.ecotel.plan_service.dto.response.FullPlanResponse;
import com.ecotel.plan_service.dto.response.transaction.DetailTransactionResponse;
import com.ecotel.plan_service.dto.response.transaction.TransactionResponse;
import com.ecotel.plan_service.dto.response.vehicle.VehicleResponse;
import com.ecotel.plan_service.enums.PlanStatus;
import com.ecotel.plan_service.service.PlanService;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class PlanController {
    private final PlanService planService;

    // GET ALL PLANS
    @GetMapping
    public ApiResponse<List<FullPlanResponse>> getAllPlans() {
        List<FullPlanResponse> fullPlanResponseList = planService.getAllPlans();
        return ApiResponse.<List<FullPlanResponse>>builder()
                .message("Plans retrieved successfully")
                .data(fullPlanResponseList)
                .build();
    }

    // GET PLAN BY ID
    @GetMapping("/{planId}")
    public ApiResponse<FullPlanResponse> getPlanById(@PathVariable String planId) {
        FullPlanResponse fullPlanResponse = planService.getPlanById(planId);
        return ApiResponse.<FullPlanResponse>builder()
                .message("Plan retrieved successfully")
                .data(fullPlanResponse)
                .build();
    }

    // GET PLANS BY STATUS
    @GetMapping("/status")
    public ApiResponse<List<FullPlanResponse>> getPlansByStatus(@PathParam("status") PlanStatus status) {
        List<FullPlanResponse> fullPlanResponseList = planService.getPlansByStatus(status);
        return ApiResponse.<List<FullPlanResponse>>builder()
                .message("Plans retrieved successfully")
                .data(fullPlanResponseList)
                .build();
    }

    // GET PLANS BY LICENSE PLATE AND DATE RANGE
    @GetMapping("/search/{licensePlate}")
    public ApiResponse<VehicleResponse> getPlansByLicensePlateAndDateRange(@PathVariable String licensePlate) {
        VehicleResponse response = planService.getPlansByLicensePlate(licensePlate);
        return ApiResponse.<VehicleResponse>builder()
                .message("Plans retrieved successfully")
                .data(response)
                .build();
    }

    // GET PLAN ID BY LICENSE PLATE TODAY
    @GetMapping("/search/id/{licensePlate}")
    public ApiResponse<String> getPlanIdByLicensePlateToday(@PathVariable String licensePlate) {
        String planId = planService.getPlanIdByLicensePlate(licensePlate);
        return ApiResponse.<String>builder()
                .message("Plan ID retrieved successfully")
                .data(planId)
                .build();
    }

    // GET PLAN BY LICENSE PLATE AND WAREHOUSE ID TODAY
    @GetMapping("/search/{licensePlate}/{warehouseId}")
    public ApiResponse<TransactionResponse> getPlanByLicensePlateAndWarehouseIdToday(@PathVariable String licensePlate,
                                                                                     @PathVariable String warehouseId) {
        TransactionResponse transactionResponse = planService.getPlanByLicensePlateAndWarehouseIdToday(licensePlate, warehouseId);
        return ApiResponse.<TransactionResponse>builder()
                .message("Plan retrieved successfully")
                .data(transactionResponse)
                .build();
    }

    // CREATE PLAN
    @PostMapping("/create")
    public ApiResponse<FullPlanResponse> createPlan(@RequestBody FullPlanRequest request) {
        FullPlanResponse fullPlanResponse = planService.createPlan(request);
        return ApiResponse.<FullPlanResponse>builder()
                .message("Plan created successfully")
                .data(fullPlanResponse)
                .build();
    }

    // UPDATE PLAN
    @PutMapping("/update/{planId}")
    public ApiResponse<FullPlanResponse> updatePlan(@PathVariable String planId,
                                                    @RequestBody FullPlanRequest request) {
        FullPlanResponse fullPlanResponse = planService.updatePlan(planId, request);
        return ApiResponse.<FullPlanResponse>builder()
                .message("Plan updated successfully")
                .data(fullPlanResponse)
                .build();
    }
}
