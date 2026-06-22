package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.response.StockCountResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.model.StockCount;
import com.ecotel.inventory_optimization_service.repository.StockCountRepository;
import com.ecotel.inventory_optimization_service.service.StockCountService;
import com.ecotel.inventory_optimization_service.service.employee.EmployeeServiceClient;
import com.ecotel.inventory_optimization_service.service.supplier.SupplierServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Triển khai nghiệp vụ kiểm kê kho.
 *
 * <p>Vòng đời phiếu:
 * <pre>
 *   createDraft() → DRAFT (systemQuantity tự động từ simulateStockCountInventoryAt)
 *   confirm()     → CONFIRMED (chốt variance, không sửa được nữa)
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockCountServiceImpl implements StockCountService {
    private final EmployeeServiceClient employeeServiceClient;

    /** Ngưỡng cảnh báo thất thoát (> 5%) */
    private static final BigDecimal LOSS_WARNING_THRESHOLD = new BigDecimal("0.05");

    private final StockCountRepository    stockCountRepository;
    private final InventoryPlanningService planningService;      // dùng simulateStockCountInventoryAt()
    private final SupplierServiceClient   supplierServiceClient; // lấy đơn giá để tính varianceValue

    @Override
    @Transactional
    public StockCountResponse createDraft(String productId, LocalDate countDate, String countedBy) {
        // Kiểm tra trùng
        if (stockCountRepository.existsByProductIdAndCountDate(productId, countDate)) {
            throw new IllegalStateException(
                    "Đã có phiếu kiểm kê cho sản phẩm " + productId + " vào ngày " + countDate +
                    ". Không thể tạo thêm (mỗi ngày chỉ 1 phiếu).");
        }

        // Tính systemQuantity bằng simulateStockCountInventoryAt()
        BigDecimal systemQty = planningService.simulateStockCountInventoryAt(productId, countDate);
        if (systemQty == null) {
            log.warn("Không có kế hoạch ACTIVE cho productId={}. systemQuantity = 0", productId);
            systemQty = BigDecimal.ZERO;
        }

        StockCount draft = StockCount.builder()
                .productId(productId)
                .countDate(countDate)
                .systemQuantity(systemQty)
                .countedBy(countedBy)
                .status("DRAFT")
                .build();

        draft = stockCountRepository.save(draft);
        log.info("Tạo phiếu kiểm kê DRAFT id={} cho productId={} vào {}, systemQty={}",
                draft.getId(), productId, countDate, systemQty);

        return toResponse(draft);
    }

    @Override
    @Transactional
    public StockCountResponse confirm(Long stockCountId, BigDecimal actualQuantity, String notes) {
        StockCount sc = stockCountRepository.findById(stockCountId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu kiểm kê", stockCountId));

        if ("CONFIRMED".equals(sc.getStatus())) {
            throw new IllegalStateException("Phiếu kiểm kê id=" + stockCountId + " đã CONFIRMED, không thể chỉnh sửa.");
        }

        // Tính variance
        BigDecimal varianceQty = actualQuantity.subtract(sc.getSystemQuantity());
        BigDecimal varianceRate = sc.getSystemQuantity().compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : varianceQty.divide(sc.getSystemQuantity(), 4, RoundingMode.HALF_UP);

        // Lấy đơn giá từ Supplier Service để tính varianceValue
        BigDecimal unitPrice = supplierServiceClient.getByProductId(sc.getProductId())
                .map(sp -> sp.getUnitPrice())
                .orElse(BigDecimal.ZERO);
        BigDecimal varianceValue = varianceQty.multiply(unitPrice).setScale(4, RoundingMode.HALF_UP);

        sc.setActualQuantity(actualQuantity);
        sc.setVarianceQty(varianceQty);
        sc.setVarianceRate(varianceRate);
        sc.setVarianceValue(varianceValue);
        sc.setNotes(notes);
        sc.setStatus("CONFIRMED");
        sc.setConfirmedAt(LocalDateTime.now());

        sc = stockCountRepository.save(sc);
        log.info("CONFIRMED phiếu kiểm kê id={}: actual={}, variance={} ({}%)",
                stockCountId, actualQuantity,
                varianceQty.setScale(2, RoundingMode.HALF_UP),
                varianceRate.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));

        return toResponse(sc);
    }

    @Override
    public List<StockCountResponse> getHistory(String productId) {
        return stockCountRepository.findByProductIdOrderByCountDateDesc(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Optional<StockCount> findLatestConfirmedBefore(String productId, LocalDate date) {
        return stockCountRepository.findConfirmedBeforeDate(productId, date)
                .stream()
                .findFirst();
    }

    // ── Mapper ──────────────────────────────────────────────────────────────────

    private StockCountResponse toResponse(StockCount sc) {
        boolean lossWarning = false;
        if (sc.getVarianceRate() != null && sc.getVarianceQty() != null) {
            // Cảnh báo khi actual < system (varianceQty < 0) VÀ |rate| > 5%
            lossWarning = sc.getVarianceQty().signum() < 0
                    && sc.getVarianceRate().abs().compareTo(LOSS_WARNING_THRESHOLD) > 0;
        }

        return StockCountResponse.builder()
                .id(sc.getId())
                .productId(sc.getProductId())
                .countDate(sc.getCountDate())
                .systemQuantity(sc.getSystemQuantity())
                .actualQuantity(sc.getActualQuantity())
                .varianceQty(sc.getVarianceQty())
                .varianceRate(sc.getVarianceRate())
                .varianceValue(sc.getVarianceValue())
                .countedBy(employeeServiceClient.getFullNameById(sc.getCountedBy()))
                .notes(sc.getNotes())
                .status(sc.getStatus())
                .lossWarning(lossWarning)
                .createdAt(sc.getCreatedAt())
                .confirmedAt(sc.getConfirmedAt())
                .build();
    }
}
