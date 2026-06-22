package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.LossRateAnalysisResponse;
import java.time.LocalDate;

public interface LossRateAnalyticsService {

    /**
     * Phân tích tỷ lệ thất thoát/hao hụt của sản phẩm trong khoảng thời gian.
     *
     * Dữ liệu lấy từ các phiếu kiểm kê CONFIRMED của sản phẩm.
     * Tính tỷ lệ mất hàng trung bình và so sánh với tỷ lệ phế liệu cấu hình.
     *
     * @param productId ID sản phẩm (UUID từ product-service)
     * @param from Ngày bắt đầu (inclusive)
     * @param to   Ngày kết thúc (inclusive)
     * @return Kết quả phân tích với các metrics và đề xuất
     */
    LossRateAnalysisResponse analyzeLossRate(String productId, LocalDate from, LocalDate to);
}
