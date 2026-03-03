package com.ecotel.transaction_service.controller;

import com.ecotel.transaction_service.dto.request.InOutTransactionRequest;
import com.ecotel.transaction_service.dto.request.InOutTransactionUpdateRequest;
import com.ecotel.transaction_service.dto.response.ApiResponse;
import com.ecotel.transaction_service.dto.response.InOutTransactionResponse;
import com.ecotel.transaction_service.service.InOutTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class InOutTransactionController {
    private final InOutTransactionService inOutTransactionService;

    // GET ALL TRANSACTIONS
    @GetMapping
    public ApiResponse<List<InOutTransactionResponse>> getAllTransactions() {
        List<InOutTransactionResponse> responses = inOutTransactionService.getAllTransactions();
        return ApiResponse.<List<InOutTransactionResponse>>builder()
                .message("Transactions retrieved successfully")
                .data(responses)
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
}
