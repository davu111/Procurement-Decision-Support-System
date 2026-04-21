package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.model.InventoryParameter;
import com.ecotel.inventory_optimization_service.model.OrderSchedule;
import com.ecotel.inventory_optimization_service.repository.InventoryParameterRepository;
import com.ecotel.inventory_optimization_service.repository.OrderScheduleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderScheduleChainService {

    private final InventoryParameterRepository parameterRepository;
    private final OrderScheduleRepository scheduleRepository;

    /**
     * Lấy tất cả OrderSchedules hợp lệ của một product theo chuỗi ghì đè
     * Bắt đầu từ InventoryParameter không bị ghì đè (top-level)
     *
     * @param productId ID của sản phẩm
     * @return Danh sách OrderSchedules được sắp xếp theo orderDate
     */
    @Transactional(readOnly = true)
    public List<OrderSchedule> getActiveOrderScheduleChain(Long productId) {
        // Tìm InventoryParameter không bị ghì đè (top-level)
        InventoryParameter topLevelParam = findTopLevelParameter(productId);

        if (topLevelParam == null) {
            log.warn("No top-level InventoryParameter found for product {}", productId);
            return Collections.emptyList();
        }

        log.info("Starting chain from top-level parameter: {}", topLevelParam.getId());

        return collectOrderSchedulesChain(topLevelParam);
    }

    /**
     * Lấy OrderSchedules theo chuỗi bắt đầu từ một InventoryParameter cụ thể
     *
     * @param parameterId ID của InventoryParameter bắt đầu
     * @return Danh sách OrderSchedules
     */
    @Transactional(readOnly = true)
    public List<OrderSchedule> getOrderScheduleChainFromParameter(Long parameterId) {
        InventoryParameter parameter = parameterRepository.findById(parameterId)
                .orElseThrow(() -> new EntityNotFoundException("InventoryParameter not found: " + parameterId));

        return collectOrderSchedulesChain(parameter);
    }

    /**
     * Tìm InventoryParameter không bị ghì đè (không có parameter nào khác có param_receipt = id này)
     */
    private InventoryParameter findTopLevelParameter(Long productId) {
        List<InventoryParameter> candidates = parameterRepository
                .findTopLevelParametersByProduct(productId);

        if (candidates.isEmpty()) {
            return null;
        }

        // Nếu có nhiều top-level, lấy cái mới nhất (theo actualFirstOrderDate hoặc planStartDate)
        return candidates.stream()
                .max(Comparator.comparing(
                        p -> p.getActualFirstOrderDate() != null
                                ? p.getActualFirstOrderDate()
                                : p.getPlanStartDate()
                ))
                .orElse(candidates.get(0));
    }

    /**
     * Thu thập OrderSchedules theo chuỗi ghì đè
     */
    private List<OrderSchedule> collectOrderSchedulesChain(InventoryParameter startParameter) {
        List<OrderSchedule> result = new ArrayList<>();
        InventoryParameter currentParam = startParameter;
        LocalDate cutoffDate = LocalDate.of(9999, 12, 31); // Giá trị xa vô cùng cho lần đầu tiên

        int depth = 0;
        final int MAX_DEPTH = 100; // Bảo vệ khỏi vòng lặp vô hạn

        while (currentParam != null && depth < MAX_DEPTH) {
            depth++;

            log.info("Processing parameter {} (depth {}), cutoffDate: {}",
                    currentParam.getId(), depth, cutoffDate);

            // Lấy OrderSchedules có expectedDeliveryDate < cutoffDate
            List<OrderSchedule> schedules = scheduleRepository
                    .findByParameterIdAndDeliveryDateBefore(
                            currentParam.getId(),
                            cutoffDate
                    );

            log.info("Found {} schedules for parameter {}", schedules.size(), currentParam.getId());

            result.addAll(schedules);

            // Kiểm tra param_receipt
            if (currentParam.getParamReceipt() == null) {
                log.info("Reached end of chain at parameter {}", currentParam.getId());
                break;
            }

            // Lấy InventoryParameter tiếp theo (bị ghì đè)
            Long nextParamId = currentParam.getParamReceipt();
            InventoryParameter nextParam = parameterRepository.findById(nextParamId)
                    .orElse(null);

            if (nextParam == null) {
                log.warn("param_receipt {} not found, stopping chain", nextParamId);
                break;
            }

            // Cập nhật cutoffDate = actualFirstOrderDate của parameter hiện tại
            cutoffDate = currentParam.getActualFirstOrderDate();

            if (cutoffDate == null) {
                log.warn("actualFirstOrderDate is null for parameter {}, using planStartDate",
                        currentParam.getId());
                cutoffDate = currentParam.getPlanStartDate();
            }

            currentParam = nextParam;
        }

        if (depth >= MAX_DEPTH) {
            log.error("Max depth reached, possible circular reference in param_receipt chain");
        }

        // Sắp xếp theo orderDate
        result.sort(Comparator.comparing(OrderSchedule::getOrderDate));

        log.info("Collected total {} schedules from chain", result.size());

        return result;
    }

    /**
     * Kiểm tra xem một InventoryParameter có bị ghì đè không
     */
    public boolean isSupersededByAnother(Long parameterId) {
        return parameterRepository.existsByParamReceipt(parameterId);
    }

    /**
     * Lấy InventoryParameter ghì đè lên parameter hiện tại (nếu có)
     */
    public Optional<InventoryParameter> findSupersedingParameter(Long parameterId) {
        return parameterRepository.findByParamReceipt(parameterId);
    }

    /**
     * Lấy toàn bộ chuỗi ghì đè (từ top đến bottom)
     */
    @Transactional(readOnly = true)
    public List<InventoryParameter> getParameterChain(Long productId) {
        List<InventoryParameter> chain = new ArrayList<>();
        InventoryParameter currentParam = findTopLevelParameter(productId);

        int depth = 0;
        final int MAX_DEPTH = 100;

        while (currentParam != null && depth < MAX_DEPTH) {
            depth++;
            chain.add(currentParam);

            if (currentParam.getParamReceipt() == null) {
                break;
            }

            currentParam = parameterRepository.findById(currentParam.getParamReceipt())
                    .orElse(null);
        }

        return chain;
    }
}
