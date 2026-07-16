package com.ecotel.inventory_optimization_service.service.dashboard;

import com.ecotel.inventory_optimization_service.dto.response.dashboard.SupplyStatusResponse;

import java.util.List;

/**
 * Dashboard cung cấp trạng thái tồn kho tức thời cho từng sản phẩm.
 *
 * Trả lời câu hỏi hành động hàng ngày:
 *   "Sản phẩm nào sắp hết hàng? Tôi có kịp đặt không? Đơn nào bị trễ?"
 */
public interface SupplyStatusService {

    /**
     * Trả về trạng thái cung ứng của danh sách sản phẩm.
     *
     * Filter logic (ưu tiên từ trên xuống):
     *   1. productIds không rỗng → lọc theo danh sách đó
     *   2. categoryId không rỗng → không có support (không có API trong ProductService) → bỏ qua
     *   3. Mặc định → tất cả sản phẩm có kế hoạch ACTIVE
     *
     * Sort: CRITICAL → WARNING → OK, trong cùng nhóm sort DOS_raw tăng dần (cấp thiết nhất lên đầu).
     *
     * @param productIds danh sách productId cần lọc (null/empty = lấy tất cả)
     * @param categoryId category filter (hiện chưa support, reserved cho tương lai)
     * @return danh sách SupplyStatusResponse đã sort
     */
    List<SupplyStatusResponse> getSupplyStatus(List<String> productIds, String categoryId);
}
