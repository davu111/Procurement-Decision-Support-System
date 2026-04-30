package com.ecotel.transaction_service.service;

import com.ecotel.transaction_service.model.InOutTransaction;
import com.ecotel.transaction_service.model.TransactionFile;
import com.ecotel.transaction_service.repository.InOutTransactionRepository;
import com.ecotel.transaction_service.repository.TransactionFileRepository;
import io.minio.StatObjectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileManagementService {

    private final MinioService minioService;
    private final TransactionFileRepository fileRepository;
    private final InOutTransactionRepository inOutTransactionRepository;

    /**
     * Upload file và lưu thông tin vào database
     */
    @Transactional
    public TransactionFile uploadAndSave(ByteArrayOutputStream outputStream,
                                         String fileName,
                                         String transactionId) throws Exception {
        // Find InOutTransaction
        InOutTransaction transaction = inOutTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("No find transaction with id: " + transactionId));

        // Upload lên MinIO
        String objectName = minioService.uploadPdfFile(outputStream, fileName);

        // Lấy thông tin file
        StatObjectResponse fileInfo = minioService.getFileInfo(objectName);

        // Lưu vào database
        TransactionFile uploadedFile = TransactionFile.builder()
                .fileName(fileName)
                .objectName(objectName)
                .contentType(fileInfo.contentType())
                .fileSize(fileInfo.size())
                .uploadedAt(LocalDateTime.now())
                .transaction(transaction)
                .build();

        return fileRepository.save(uploadedFile);
    }

    /**
     * Lấy URL xem file (tạo mới mỗi lần gọi, URL luôn fresh)
     */
    public String getViewUrl(Long fileId) throws Exception {
        TransactionFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Tạo presigned URL mới (hết hạn sau 1 giờ)
        return minioService.getViewUrl(file.getObjectName(), 3600);
    }

    /**
     * Lấy URL download file (tạo mới mỗi lần gọi)
     */
    public String getDownloadUrl(Long fileId) throws Exception {
        TransactionFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Tạo presigned URL mới (hết hạn sau 1 giờ)
        return minioService.getDownloadUrl(file.getObjectName(), 3600);
    }
}
