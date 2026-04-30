package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.mapper.InventoryResultMapper;
import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryResultService {
    private final InventoryParameterRepository inventoryParameterRepository;
    private final InventoryResultRepository inventoryResultRepository;
    private final InventoryResultMapper inventoryResultMapper;

    // Get inventory results by parameter ID by product id
    public InventoryCalculationResult getInventoryResultLatestByProductId(String productId) {
        Long parameterId = inventoryParameterRepository.findTopByProductIdOrderByUpdatedAtDesc(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tham số tối ưu hóa cho sản phẩm ID: " + productId))
                .getId();

        InventoryResult result = inventoryResultRepository.findByInventoryParameterId(parameterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kết quả tối ưu hóa với tham số ID: " + parameterId));

        return inventoryResultMapper.toInventoryCalculationResult(result);
    }

    // Get inventory results by parameter ID by product id and date range
    public List<InventoryCalculationResult> getInventoryResultByProductIdAndPlanStartDateBetween(String productId, LocalDate startDate, LocalDate endDate) {
        List<Long> parameterId = inventoryParameterRepository.findOverlappingPlans(productId, startDate, endDate)
                .stream()
                .map(InventoryParameter::getId)
                .toList();
        System.out.println(parameterId + " - parameterId" +               " - productId: " + productId +
                " - startDate: " + startDate +
                " - endDate: " + endDate);

        List<InventoryResult> result = inventoryResultRepository.findByInventoryParameterIdIn(parameterId)
                .stream()
                .toList();

        return result.stream()
                .map(inventoryResultMapper::toInventoryCalculationResult)
                .toList();
    }
}
