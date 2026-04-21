package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.dto.response.ImportResultResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.mapper.ConsumptionHistoryMapper;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.model.Product;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.inventory_optimization_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsumptionHistoryService {
    private final ProductRepository productRepository;
    private final ConsumptionHistoryRepository historyRepository;
    private final ConsumptionHistoryMapper historyMapper;

    @Transactional
    public ConsumptionHistoryResponse record (ConsumptionHistoryRequest request){
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Mặt hàng", request.getProductId()));

        ConsumptionHistory history = historyMapper.toConsumptionHistory(request, product);

        ConsumptionHistory saved = historyRepository.save(history);
        return historyMapper.toConsumptionHistoryResponse(saved);
    }

    public List<ConsumptionHistoryResponse> getHistory(Long productId) {
        List<ConsumptionHistory> history = historyRepository
                .findByProductIdOrderByPeriodStartDateAsc(productId);
        return history.stream()
                .map(historyMapper::toConsumptionHistoryResponse)
                .toList();
    }
    public List<ConsumptionHistoryResponse> getByYear(Long productId, int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        List<ConsumptionHistory> consumptionHistories = historyRepository
                .findByProduct_IdAndPeriodStartDateBetweenOrderByPeriodStartDateAsc(
                        productId, start, end
                );
        return consumptionHistories.stream()
                .map(historyMapper::toConsumptionHistoryResponse)
                .toList();
    }
}
