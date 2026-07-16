package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.InventoryVelocityResponse;
import com.ecotel.inventory_optimization_service.dto.response.dashboard.SupplyStatusResponse;
import com.ecotel.inventory_optimization_service.service.InventoryVelocityService;
import com.ecotel.inventory_optimization_service.service.dashboard.SupplyStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard endpoints — trả lời câu hỏi hành động hàng ngày:
 *   "Sản phẩm nào sắp hết hàng? Tôi có kịp đặt không? Đơn nào bị trễ?"
 *
 * Endpoints:
 *   GET /api/dashboard/supply-status
 *       ?productIds=abc-123,xyz-456   (optional — filter theo danh sách)
 *       &categoryId=bao-bi            (optional — reserved, chưa support)
 *
 * Response được sort: CRITICAL → WARNING → OK, trong cùng nhóm sort DOS_raw tăng dần.
 */
@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SupplyStatusService supplyStatusService;
    private final InventoryVelocityService velocityService;


    /**
     * GET /api/dashboard/supply-status
     *
     * Trả về trạng thái cung ứng của các sản phẩm.
     *
     * Query params:
     *   productIds (optional): danh sách productId phân cách bởi dấu phẩy
     *                          Ví dụ: ?productIds=abc-123,xyz-456
     *   categoryId (optional): filter theo category (chưa support, reserved)
     *
     * Response sort: CRITICAL trước → WARNING → OK, rồi DOS_raw thấp trước.
     *
     * @return List<SupplyStatusResponse> đã sort theo mức độ cấp thiết
     */
    @GetMapping("/supply-status")
    public ResponseEntity<ApiResponse<List<SupplyStatusResponse>>> getSupplyStatus(
            @RequestParam(required = false) List<String> productIds,
            @RequestParam(required = false) String categoryId) {

        log.info("[Dashboard] GET /supply-status | productIds={} | categoryId={}",
                productIds != null ? productIds.size() + " items" : "all", categoryId);

        List<SupplyStatusResponse> result = supplyStatusService.getSupplyStatus(productIds, categoryId);
        return ResponseEntity.ok(ApiResponse.success(result, "Trạng thái cung ứng hàng tồn kho"));
    }

    @GetMapping("/inventory-velocity")
    public ResponseEntity<ApiResponse<InventoryVelocityResponse>> getVelocity(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,

            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String velocity,
            @RequestParam(required = false) String abc) {

        // Default: 12 tháng gần nhất
        LocalDate effectiveTo   = to   != null ? to   : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusMonths(12);

        if (effectiveFrom.isAfter(effectiveTo)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("from phải trước to"));
        }

        InventoryVelocityResponse result =
                velocityService.analyze(effectiveFrom, effectiveTo, categoryId, velocity, abc);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
