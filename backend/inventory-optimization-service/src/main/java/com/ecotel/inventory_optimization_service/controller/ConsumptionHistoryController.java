package com.ecotel.inventory_optimization_service.controller;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.ecotel.inventory_optimization_service.dto.response.ConsumptionHistoryResponse;
import com.ecotel.inventory_optimization_service.dto.response.ImportResultResponse;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.inventory_optimization_service.service.ConsumptionHistoryImportService;
import com.ecotel.inventory_optimization_service.service.ConsumptionHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/consumption-history")
@RequiredArgsConstructor
public class ConsumptionHistoryController {

    private final ConsumptionHistoryRepository historyRepository;
    private final ConsumptionHistoryService consumptionHistoryService;
    private final ConsumptionHistoryImportService importService;

    /**
     * POST /api/consumption-history
     * Nhập dữ liệu tiêu thụ thực tế sau mỗi kỳ
     * → Đây là nền tảng cho hệ thống đề xuất tự động
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ConsumptionHistoryResponse>> record(
            @Valid @RequestBody ConsumptionHistoryRequest request) {
        ConsumptionHistoryResponse saved = consumptionHistoryService.record(request);

        int totalPoints = historyRepository.countByProductId(
                request.getProductId());

        String message = String.format(
                "Đã lưu dữ liệu tiêu thụ. Tổng số điểm dữ liệu: %d. %s",
                totalPoints, getModelReadinessMessage(totalPoints));
        return ResponseEntity.ok(ApiResponse.success(saved, message));
    }

    /**
     * GET /api/consumption-history/{productId}?planningUnit=MONTH
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<ConsumptionHistoryResponse>>> getHistory(
            @PathVariable Long productId) {
        List<ConsumptionHistoryResponse> history = consumptionHistoryService.getHistory(productId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/{productId}/year/{year}")
    public ResponseEntity<ApiResponse<List<ConsumptionHistoryResponse>>> getHistoryByYear(
            @PathVariable Long productId,
            @PathVariable int year) {
        List<ConsumptionHistoryResponse> history = consumptionHistoryService.getByYear(productId, year);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    private String getModelReadinessMessage(int count) {
        if (count < 6) return String.format("Cần %d điểm nữa để dùng Holt-Winters.", 6 - count);
        if (count < 18) return String.format("Cần %d điểm nữa để dùng Seasonal Regression.", 18 - count);
        return "Đang dùng mô hình Seasonal Regression - độ chính xác cao nhất.";
    }

    /**
     * POST /api/consumption-history/import
     * Import hàng loạt từ file CSV hoặc XLSX.
     *
     * Cấu trúc file (header bắt buộc, thứ tự cột tùy):
     *   product_id | period_start_date | period_end_date | actual_consumption
     *   | planned_consumption | actual_lead_time_days | actual_supply_rate | notes
     *
     * Định dạng ngày: yyyy-MM-dd, dd/MM/yyyy, hoặc Excel date
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportResultResponse>> importFile(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File không được để trống"));
        }

        try {
            ImportResultResponse result = importService.importFromFile(file);
            String message = String.format(
                    "Import hoàn tất: %d thành công, %d trùng lặp (bỏ qua), %d lỗi",
                    result.getSuccessCount(), result.getSkipCount(), result.getErrorCount());
            return ResponseEntity.ok(ApiResponse.success(result, message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi import file", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Lỗi hệ thống: " + e.getMessage()));
        }
    }
}
