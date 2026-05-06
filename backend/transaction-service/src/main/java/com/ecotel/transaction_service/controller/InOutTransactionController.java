package com.ecotel.transaction_service.controller;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.shared_library.dto.response.PageResponse;
import com.ecotel.transaction_service.dto.request.InOutTransactionRequest;
import com.ecotel.transaction_service.dto.request.InOutTransactionUpdateRequest;
import com.ecotel.transaction_service.dto.response.InOutTransactionResponse;
import com.ecotel.transaction_service.mapper.PageMapper;
import com.ecotel.transaction_service.service.InOutTransactionService;
import com.ecotel.transaction_service.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class InOutTransactionController {
    private final InOutTransactionService inOutTransactionService;
    private final ReportService reportService;
    private final PageMapper pageMapper;

    // GET ALL TRANSACTIONS
    @GetMapping
    public ApiResponse<PageResponse<InOutTransactionResponse>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate
    ) {
        Page<InOutTransactionResponse> result =
                inOutTransactionService.getAllTransactions(page, size, startDate, endDate);

        return ApiResponse.<PageResponse<InOutTransactionResponse>>builder()
                .message("Transactions retrieved successfully")
                .data(pageMapper.toPageResponse(result))
                .build();
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ApiResponse<PageResponse<InOutTransactionResponse>> getTransactionsByWarehouseId(
            @PathVariable String warehouseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate
    ) {
        Page<InOutTransactionResponse> result =
                inOutTransactionService.getTransactionByWarehouseId(
                        warehouseId, page, size, startDate, endDate
                );

        return ApiResponse.<PageResponse<InOutTransactionResponse>>builder()
                .message("Transactions retrieved successfully")
                .data(pageMapper.toPageResponse(result))
                .build();
    }

    // GET TRANSACTION BY ID
    @GetMapping("/{transactionId}")
    public ApiResponse<InOutTransactionResponse> getTransactionById(@PathVariable String transactionId) {
        InOutTransactionResponse response = inOutTransactionService.getTransactionById(transactionId);
        return ApiResponse.<InOutTransactionResponse>builder()
                .message("Transaction retrieved successfully")
                .data(response)
                .build();
    }

    // CREATE TRANSACTION
    @PostMapping("/create")
    public ApiResponse<InOutTransactionResponse> createTransaction(@RequestBody InOutTransactionRequest request) {
        InOutTransactionResponse response = inOutTransactionService.createTransaction(request);
        return ApiResponse.<InOutTransactionResponse>builder()
                .message("Transaction created successfully")
                .data(response)
                .build();
    }

    // CREATE TRANSACTION BATCH
    @PostMapping("/create-batch")
    public ApiResponse<List<InOutTransactionResponse>> createTransactionBatch(@RequestBody List<InOutTransactionRequest> requests) {
        List<InOutTransactionResponse> responses = inOutTransactionService.createTransactionBatch(requests);
        return ApiResponse.<List<InOutTransactionResponse>>builder()
                .message("Transaction batch created successfully")
                .data(responses)
                .build();
    }

    // UPDATE TRANSACTION
    @PutMapping("/update/{transactionId}")
    public ApiResponse<InOutTransactionResponse> updateTransaction(@PathVariable String transactionId, @RequestBody InOutTransactionRequest request) {
        InOutTransactionResponse response = inOutTransactionService.updateTransaction(transactionId, request);
        return ApiResponse.<InOutTransactionResponse>builder()
                .message("Transaction updated successfully")
                .data(response)
                .build();
    }

    // UPDATE TRANSACTION BATCH
    @PutMapping("/update-batch")
    public ApiResponse<List<InOutTransactionResponse>> updateTransactionBatch(@RequestBody List<InOutTransactionUpdateRequest> requests) {
        List<InOutTransactionResponse> responses = inOutTransactionService.updateTransactionBatch(requests);
        return ApiResponse.<List<InOutTransactionResponse>>builder()
                .message("Transaction batch updated successfully")
                .data(responses)
                .build();
    }

    // DELETE TRANSACTION
    @DeleteMapping("/delete/{transactionId}")
    public ApiResponse<Void> deleteTransaction(@PathVariable String transactionId) {
        inOutTransactionService.deleteTransaction(transactionId);
        return ApiResponse.<Void>builder()
                .message("Transaction deleted successfully")
                .build();
    }

    /**
     * Tạo file Word và lưu vào server
     *
     * @param transactionId ID
     * @return Đường dẫn file được tạo
     */
    @PostMapping("/generate")
    public ApiResponse<Long> generateReport(
            @RequestParam String transactionId) throws Exception {
            Long fileUrl = reportService.generateReport(transactionId);
            return ApiResponse.<Long>builder()
                    .message("Generated file successful")
                    .data(fileUrl)
                    .build();
    }
}
