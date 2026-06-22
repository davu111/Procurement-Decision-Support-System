package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.StockCountResponse;
import com.ecotel.inventory_optimization_service.service.StockCountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller quản lý phiếu kiểm kê kho.
 *
 * Endpoints:
 *   POST   /api/stock-counts                  — tạo phiếu DRAFT
 *   PUT    /api/stock-counts/{id}/confirm      — xác nhận phiếu
 *   GET    /api/stock-counts/{productId}       — lịch sử kiểm kê
 */
@Slf4j
@RestController
@RequestMapping("/api/stock-counts")
@RequiredArgsConstructor
public class StockCountController {

    private final StockCountService stockCountService;

    /**
     * POST /api/stock-counts
     * Tạo phiếu kiểm kê DRAFT — systemQuantity được tính tự động.
     *
     * Body: { productId, countDate, countedBy }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<StockCountResponse>> createDraft(
            @RequestBody Map<String, Object> body) {

        String productId = String.valueOf(body.get("productId"));
        LocalDate countDate = LocalDate.parse(String.valueOf(body.get("countDate")));
        String countedBy   = body.containsKey("countedBy")
                ? String.valueOf(body.get("countedBy")) : null;

        StockCountResponse response = stockCountService.createDraft(productId, countDate, countedBy);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo phiếu kiểm kê thành công."));
    }

    /**
     * PUT /api/stock-counts/{id}/confirm
     * Nhập actualQuantity, tính variance, chuyển sang CONFIRMED.
     *
     * Body: { actualQuantity, notes }
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<StockCountResponse>> confirm(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        BigDecimal actualQty = new BigDecimal(String.valueOf(body.get("actualQuantity")));
        String notes = body.containsKey("notes") ? String.valueOf(body.get("notes")) : null;

        StockCountResponse response = stockCountService.confirm(id, actualQty, notes);
        return ResponseEntity.ok(ApiResponse.success(response, "Xác nhận kiểm kê thành công."));
    }

    /**
     * GET /api/stock-counts/{productId}
     * Lịch sử kiểm kê của sản phẩm, mới nhất trước.
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<StockCountResponse>>> getHistory(
            @PathVariable String productId) {
        List<StockCountResponse> history = stockCountService.getHistory(productId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
