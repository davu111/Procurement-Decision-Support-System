package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.StockCountResponse;
import com.ecotel.inventory_optimization_service.model.StockCount;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StockCountService {

    /**
     * Tạo phiếu kiểm kê DRAFT — tự động tính systemQuantity bằng simulateInventoryAt().
     * Không cho tạo trùng (productId, countDate).
     */
    StockCountResponse createDraft(String productId, LocalDate countDate, String countedBy);

    /**
     * Xác nhận phiếu kiểm kê — nhập actualQuantity, tính variance, chốt CONFIRMED.
     * Sau khi CONFIRMED không sửa được nữa.
     */
    StockCountResponse confirm(Long stockCountId, BigDecimal actualQuantity, String notes);

    /** Lịch sử kiểm kê của sản phẩm, mới nhất trước */
    List<StockCountResponse> getHistory(String productId);

    /**
     * Lấy phiếu CONFIRMED gần nhất trước một ngày cụ thể.
     * Dùng để pre-fill initialInventory khi lập kế hoạch mới.
     */
    Optional<StockCount> findLatestConfirmedBefore(String productId, LocalDate date);
}
