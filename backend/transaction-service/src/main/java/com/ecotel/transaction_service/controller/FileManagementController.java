package com.ecotel.transaction_service.controller;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.transaction_service.model.TransactionFile;
import com.ecotel.transaction_service.service.FileManagementService;
import lombok.RequiredArgsConstructor;
import org.hibernate.Transaction;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileManagementController {

    private final FileManagementService fileManagementService;

    /**
     * Lấy URL để XEM file
     */
    @GetMapping("/{fileId}/view-url")
    public ApiResponse<String> getViewUrl(@PathVariable Long fileId) {
        try {
            String url = fileManagementService.getViewUrl(fileId);
            return ApiResponse.<String>builder()
                    .message("View file successful")
                    .data(url)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .message("View file failed")
                    .data(e.getMessage())
                    .build();
        }
    }

    /**
     * Lấy URL để DOWNLOAD file
     */
    @GetMapping("/{fileId}/download-url")
    public ApiResponse<String> getDownloadUrl(@PathVariable Long fileId) {
        try {
            String url = fileManagementService.getDownloadUrl(fileId);
            return ApiResponse.<String>builder()
                    .message("View file successful")
                    .data(url)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .message("View file failed")
                    .data(e.getMessage())
                    .build();
        }
    }
}
