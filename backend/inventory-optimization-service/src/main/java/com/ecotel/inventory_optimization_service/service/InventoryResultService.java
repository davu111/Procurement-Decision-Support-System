package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.enums.PlanningUnit;
import com.ecotel.inventory_optimization_service.mapper.InventoryResultMapper;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.InventoryResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class InventoryResultService {
    private final InventoryParameterRepository inventoryParameterRepository;
    private final InventoryResultRepository inventoryResultRepository;
    private final InventoryResultMapper inventoryResultMapper;

    // Get inventory results by parameter ID by product id
    public InventoryCalculationResult getInventoryResultLatestByProductIdAndPlanningUnit(Long productId, PlanningUnit planningUnit) {
        Long parameterId = inventoryParameterRepository.findTopByProductIdAndPlanningUnitOrderByUpdatedAtDesc(productId, planningUnit)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tham số tối ưu hóa cho sản phẩm ID: " + productId + " và đơn vị lập kế hoạch: " + planningUnit))
                .getId();

        InventoryResult result = inventoryResultRepository.findByInventoryParameterId(parameterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kết quả tối ưu hóa với tham số ID: " + parameterId));

        return inventoryResultMapper.toInventoryCalculationResult(result);
    }

    // Get inventory results by parameter ID by product id and date range
    public InventoryCalculationResult getInventoryResultByProductIdAndPlanStartDateBetweenAndPlanningUnit(Long productId, PlanningUnit planningUnit, LocalDate startDate, LocalDate endDate) {
        Long parameterId = inventoryParameterRepository.findByProductIdAndPlanStartDateBetweenAndPlanningUnit(productId, startDate, endDate, planningUnit)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tham số tối ưu hóa cho sản phẩm ID: " + productId + " và đơn vị lập kế hoạch: " + planningUnit + " từ ngày " + startDate + " đến ngày " + endDate))
                .getId();

        InventoryResult result = inventoryResultRepository.findByInventoryParameterId(parameterId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy kết quả tối ưu hóa với tham số ID: " + parameterId));

        return inventoryResultMapper.toInventoryCalculationResult(result);
    }
}
