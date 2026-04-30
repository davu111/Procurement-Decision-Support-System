package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.mapper.ConsumptionHistoryMapper;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsumptionHistoryService {
    private final ConsumptionHistoryRepository historyRepository;
    private final ConsumptionHistoryMapper historyMapper;
    private final ProductService productService;

    @Transactional
    public ConsumptionHistoryResponse record (ConsumptionHistoryRequest request){
        ConsumptionHistory history = historyMapper.toConsumptionHistory(request);

        ConsumptionHistory saved = historyRepository.save(history);
        return historyMapper.toConsumptionHistoryResponse(saved);
    }

    public List<ConsumptionHistoryResponse> getHistory(String productId) {
        List<ConsumptionHistory> history = historyRepository
                .findByProductIdOrderByPeriodStartDateAsc(productId);
        return history.stream()
                .map(historyMapper::toConsumptionHistoryResponse)
                .toList();
    }
    public List<ConsumptionHistoryResponse> getByYear(String productId, int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        List<ConsumptionHistory> consumptionHistories = historyRepository
                .findByProductIdAndPeriodStartDateBetweenOrderByPeriodStartDateAsc(
                        productId, start, end
                );
        return consumptionHistories.stream()
                .map(historyMapper::toConsumptionHistoryResponse)
                .toList();
    }

    private ProductResponse findProduct(String productId) {
        ProductResponse product = productService.getProductById(productId);
        if (product == null) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId);
        }
        return product;
    }
}
