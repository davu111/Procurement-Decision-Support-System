package com.ecotel.vehicle_service.service;

import com.ecotel.vehicle_service.dto.request.VehicleRequest;
import com.ecotel.vehicle_service.dto.request.VehicleStateHistoryRequest;
import com.ecotel.vehicle_service.dto.request.VehicleTypeRequest;
import com.ecotel.vehicle_service.dto.response.ApiResponse;
import com.ecotel.vehicle_service.dto.response.VehicleResponse;
import com.ecotel.vehicle_service.dto.response.VehicleStateHistoryResponse;
import com.ecotel.vehicle_service.dto.response.VehicleTypeResponse;
import com.ecotel.vehicle_service.mapper.VehicleMapper;
import com.ecotel.vehicle_service.mapper.VehicleStateHistoryMapper;
import com.ecotel.vehicle_service.mapper.VehicleTypeMapper;
import com.ecotel.vehicle_service.model.Vehicle;
import com.ecotel.vehicle_service.model.VehicleStateHistory;
import com.ecotel.vehicle_service.model.VehicleType;
import com.ecotel.vehicle_service.repository.VehicleRepository;
import com.ecotel.vehicle_service.repository.VehicleStateHistoryRepository;
import com.ecotel.vehicle_service.repository.VehicleTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private final VehicleStateHistoryRepository vehicleStateHistoryRepository;

    private final VehicleMapper vehicleMapper;
    private final VehicleTypeMapper vehicleTypeMapper;
    private final VehicleStateHistoryMapper vehicleStateHistoryMapper;

    private final WebClient webClient;

    // GET ALL VEHICLES
    public List<VehicleResponse> getAll() {
        return vehicleRepository.findAll().stream()
                .map(vehicle -> {
                    String currentPlanId = webClient.get()
                            .uri("/plans/search/id/{licensePlate}", vehicle.getLicensePlate())
//                    .headers(headers -> {
//                        assert tokenValue != null;
//                        headers.setBearerAuth(tokenValue);
//                    }) // ✅ Gắn Authorization header
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<ApiResponse<String>>() {
                            })
                            .flatMap(response -> Mono.justOrEmpty(
                                    response == null ? null : response.getData()
                            ))
                            .block();

                    vehicle.setCurrentPlanId(currentPlanId);
                    vehicleRepository.save(vehicle); // Cập nhật vehicle với currentPlanId mới
                    return vehicleMapper.toVehicleResponse(vehicle);
                }).toList();
    }

    // GET VEHICLE BY ID
    public VehicleResponse getById(String vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        return vehicleMapper.toVehicleResponse(vehicle);
    }

    // GET VEHICLE BY LICENSE PLATE
    public VehicleResponse getByLicensePlate(String licensePlate) {
        Vehicle vehicle = vehicleRepository.findByLicensePlate(licensePlate)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with license plate: " + licensePlate));
        return vehicleMapper.toVehicleResponse(vehicle);
    }

    // GET ALL VEHICLES TYPE
    public List<VehicleTypeResponse> getAllVehicleTypes() {
        return vehicleTypeRepository.findAll().stream()
                .map(vehicleTypeMapper::toVehicleTypeResponse)
                .toList();
    }

    // GET ALL VEHICLES STATE HISTORY
    public List<VehicleStateHistoryResponse> getAllVehicleStateHistories() {
        return vehicleStateHistoryRepository.findAll().stream()
                .map(vehicleStateHistoryMapper::toVehicleStateHistoryResponse)
                .toList();
    }

    /// CREATE METHOD
    // CREATE VEHICLE
    public VehicleResponse createVehicle(VehicleRequest request){
        Vehicle vehicle = vehicleMapper.toVehicle(request);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return vehicleMapper.toVehicleResponse(savedVehicle);
    }

    // CREATE VEHICLE TYPE
    public VehicleTypeResponse createVehicleType(VehicleTypeRequest request){
        VehicleType vehicleType = vehicleTypeMapper.toVehicleType(request);
        VehicleType savedVehicleType = vehicleTypeRepository.save(vehicleType);
        return vehicleTypeMapper.toVehicleTypeResponse(savedVehicleType);
    }

    // CREATE VEHICLE STATE HISTORY
    public VehicleStateHistoryResponse createVehicleStateHistory(VehicleStateHistoryRequest request) {
        VehicleStateHistory vehicleStateHistory = vehicleStateHistoryMapper.toVehicleStateHistory(request);
        VehicleStateHistory savedVehicle = vehicleStateHistoryRepository.save(vehicleStateHistory);
        return vehicleStateHistoryMapper.toVehicleStateHistoryResponse(savedVehicle);
    }

    // CREATE VEHICLE BATCH
    public List<VehicleResponse> createVehicleBatch(List<VehicleRequest> requests) {
        List<Vehicle> vehicles = requests.stream()
                .map(vehicleMapper::toVehicle)
                .toList();
        List<Vehicle> savedVehicles = vehicleRepository.saveAll(vehicles);
        return savedVehicles.stream()
                .map(vehicleMapper::toVehicleResponse)
                .toList();
    }

    // CREATE VEHICLE TYPE BATCH
    public List<VehicleTypeResponse> createVehicleTypeBatch(List<VehicleTypeRequest> requests) {
        List<VehicleType> vehicleTypes = requests.stream()
                .map(vehicleTypeMapper::toVehicleType)
                .toList();
        List<VehicleType> savedVehicleTypes = vehicleTypeRepository.saveAll(vehicleTypes);
        return savedVehicleTypes.stream()
                .map(vehicleTypeMapper::toVehicleTypeResponse)
                .toList();
    }

    // CREATE VEHICLE STATE HISTORY BATCH
    public List<VehicleStateHistoryResponse> createVehicleStateHistoryBatch(List<VehicleStateHistoryRequest> requests) {
        List<VehicleStateHistory> vehicleStateHistories = requests.stream()
                .map(vehicleStateHistoryMapper::toVehicleStateHistory)
                .toList();
        List<VehicleStateHistory> savedVehicleStateHistories = vehicleStateHistoryRepository.saveAll(vehicleStateHistories);
        return savedVehicleStateHistories.stream()
                .map(vehicleStateHistoryMapper::toVehicleStateHistoryResponse)
                .toList();
    }

    /// UPDATE METHOD
    // UPDATE VEHICLE
    public VehicleResponse updateVehicle(String vehicleId, VehicleRequest request) {
        Vehicle existingVehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        vehicleMapper.updateVehicleFromRequest(request, existingVehicle);
        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return vehicleMapper.toVehicleResponse(updatedVehicle);
    }

    // UPDATE VEHICLE TYPE
    public VehicleTypeResponse updateVehicleType(String vehicleTypeId, VehicleTypeRequest request) {
        VehicleType existingVehicleType = vehicleTypeRepository.findById(vehicleTypeId)
                .orElseThrow(() -> new RuntimeException("Vehicle Type not found with id: " + vehicleTypeId));
        vehicleTypeMapper.updateVehicleTypeFromRequest(request, existingVehicleType);
        VehicleType updatedVehicleType = vehicleTypeRepository.save(existingVehicleType);
        return vehicleTypeMapper.toVehicleTypeResponse(updatedVehicleType);
    }

    // UPDATE VEHICLE STATE HISTORY
    public VehicleStateHistoryResponse updateVehicleStateHistory(String vehicleStateHistoryId, VehicleStateHistoryRequest request) {
        VehicleStateHistory existingVehicleStateHistory = vehicleStateHistoryRepository.findById(vehicleStateHistoryId)
                .orElseThrow(() -> new RuntimeException("Vehicle State History not found with id: " + vehicleStateHistoryId));
        vehicleStateHistoryMapper.updateVehicleStateHistoryFromRequest(request, existingVehicleStateHistory);
        VehicleStateHistory updatedVehicleStateHistory = vehicleStateHistoryRepository.save(existingVehicleStateHistory);
        return vehicleStateHistoryMapper.toVehicleStateHistoryResponse(updatedVehicleStateHistory);
    }

    /// DELETE METHOD -- HARD DELETE
    // DELETE VEHICLE
    public void deleteVehicle(String vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }

    // DELETE VEHICLE TYPE
    public void deleteVehicleType(String vehicleTypeId) {
        vehicleTypeRepository.deleteById(vehicleTypeId);
    }

    // DELETE VEHICLE STATE HISTORY
    public void deleteVehicleStateHistory(String vehicleStateHistoryId) {
        vehicleStateHistoryRepository.deleteById(vehicleStateHistoryId);
    }
}
