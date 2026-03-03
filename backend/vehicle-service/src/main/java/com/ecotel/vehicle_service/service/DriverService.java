package com.ecotel.vehicle_service.service;

import com.ecotel.vehicle_service.model.Driver;
import com.ecotel.vehicle_service.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DriverService {
    private final DriverRepository driverRepository;

    // GET DRIVER NAME BY ID
    public String getDriverNameById(String driverId) {
        return driverRepository.findById(driverId)
                .map(Driver::getName)
                .orElse("Unknown Driver");
    }
}
