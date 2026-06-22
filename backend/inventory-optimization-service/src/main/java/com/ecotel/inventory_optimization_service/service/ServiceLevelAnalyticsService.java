package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.response.ServiceLevelAnalysisResponse;
import java.time.LocalDate;

public interface ServiceLevelAnalyticsService {

    /**
     * Phân tích Service Level của sản phẩm trong khoảng thời gian.
     *
     * Logic on-the-fly:
     *   1. Lấy tất cả lịch đặt hàng (OrderSchedule) của sản phẩm trong [from, to]
     *   2. Với mỗi chu kỳ đặt hàng:
     *      - Tính độ trễ giao hàng: days(actualDeliveryDate - expectedDeliveryDate)
     *      - Mô phỏng tồn kho trong chu kỳ để đếm ngày chạm 0 (stockout)
     *   3. Aggregated metrics:
     *      - Service Level = 1 - (stockout cycles / total cycles)
     *      - Avg stockout duration = total stockout days / stockout cycles
     *      - Avg delivery delay = total delay days / total cycles
     *
     * @param productId ID sản phẩm
     * @param from Ngày bắt đầu (inclusive)
     * @param to Ngày kết thúc (inclusive)
     * @return Kết quả phân tích Service Level
     */
    ServiceLevelAnalysisResponse analyzeServiceLevel(String productId, LocalDate from, LocalDate to);

    /**
     * Endpoint hỗ trợ: xác nhận ngày giao hàng thực tế cho một OrderSchedule.
     * Cập nhật trường actualDeliveryDate trong OrderSchedule.
     *
     * @param orderId ID của OrderSchedule
     * @param actualDeliveryDate Ngày giao hàng thực tế
     */
    void confirmDelivery(Long orderId, LocalDate actualDeliveryDate);
}
