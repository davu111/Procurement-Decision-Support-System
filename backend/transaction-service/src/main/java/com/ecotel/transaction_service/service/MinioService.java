package com.ecotel.transaction_service.service;

import com.ecotel.transaction_service.dto.response.FileUploadResponse;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${minio.url}")
    private String minioInternalUrl;

    @Value("${minio.public-url}")
    private String minioPublicUrl;

    /**
     * Kiểm tra và tạo bucket nếu chưa tồn tại
     */
    public void ensureBucketExists() throws Exception {
        boolean found = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build()
        );

        if (!found) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
            log.info("Bucket '{}' created successfully", bucketName);
        } else {
            log.info("Bucket '{}' already exists", bucketName);
        }
    }

    /**
     * Upload file từ ByteArrayOutputStream lên MinIO
     *
     * @param outputStream ByteArrayOutputStream chứa nội dung file
     * @param fileName     Tên file trên MinIO
     * @param contentType  Content type (vd: application/vnd.openxmlformats-officedocument.wordprocessingml.document)
     * @return URL hoặc object name của file đã upload
     */
    public String uploadFile(ByteArrayOutputStream outputStream, String fileName, String contentType)
            throws Exception {

        ensureBucketExists();

        byte[] content = outputStream.toByteArray();
        InputStream inputStream = new ByteArrayInputStream(content);

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .stream(inputStream, content.length, -1)
                        .contentType(contentType)
                        .build()
        );

        log.info("File '{}' uploaded successfully to bucket '{}'", fileName, bucketName);

        // Trả về object name (có thể dùng để download sau)
        return fileName;
    }

    /**
     * Upload file Word (docx)
     */
    public String uploadWordFile(ByteArrayOutputStream outputStream, String fileName) throws Exception {
        return uploadFile(
                outputStream,
                fileName,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
    }
    public String uploadPdfFile(ByteArrayOutputStream outputStream, String fileName) throws Exception {
        return uploadFile(
                outputStream,
                fileName,
                "application/pdf"
        );
    }

    /**
     * Lấy URL để download file (presigned URL, có thời hạn)
     *
     * @param objectName Tên object trên MinIO
     * @param expiry     Thời gian hết hạn (giây), mặc định 7 ngày
     * @return Presigned URL
     */
    /**
     * Thay thế internal URL bằng public URL trong presigned URL.
     * MinIO SDK luôn sinh URL dựa trên endpoint khi khởi tạo client.
     * Nếu public-url khác internal url, ta cần rewrite lại để browser có thể truy cập.
     */
    private String toPublicUrl(String presignedUrl) {
        if (presignedUrl == null) return null;
        String normalizedInternal = minioInternalUrl.endsWith("/")
                ? minioInternalUrl.substring(0, minioInternalUrl.length() - 1)
                : minioInternalUrl;
        String normalizedPublic = minioPublicUrl.endsWith("/")
                ? minioPublicUrl.substring(0, minioPublicUrl.length() - 1)
                : minioPublicUrl;
        return presignedUrl.replace(normalizedInternal, normalizedPublic);
    }

    public String getPresignedUrl(String objectName, int expiry) throws Exception {
        String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(io.minio.http.Method.GET)
                        .bucket(bucketName)
                        .object(objectName)
                        .expiry(expiry) // seconds
                        .build()
        );
        return toPublicUrl(url);
    }

    /**
     * Lấy URL với thời gian hết hạn mặc định (1 ngày)
     */
    public String getPresignedUrl(String objectName) throws Exception {
        return getPresignedUrl(objectName, 24 * 60 * 60); // 1 day
    }

    /**
     * Lấy presigned URL để XEM file (inline - hiển thị trên browser)
     */
    public String getViewUrl(String objectName, int expiry) throws Exception {
        String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(io.minio.http.Method.GET)
                        .bucket(bucketName)
                        .object(objectName)
                        .expiry(expiry)
                        // KHÔNG có response-content-disposition
                        .build()
        );
        return toPublicUrl(url);
    }

    /**
     * Lấy presigned URL để DOWNLOAD file (attachment - force download)
     */
    public String getDownloadUrl(String objectName, int expiry) throws Exception {
        Map<String, String> reqParams = new HashMap<>();
        reqParams.put("response-content-disposition",
                "attachment; filename=\"" + objectName + "\"");

        String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(io.minio.http.Method.GET)
                        .bucket(bucketName)
                        .object(objectName)
                        .expiry(expiry)
                        .extraQueryParams(reqParams)  // Có attachment header
                        .build()
        );
        return toPublicUrl(url);
    }

    /**
     * Lấy thông tin file từ MinIO
     */
    public StatObjectResponse getFileInfo(String objectName) throws Exception {
        return minioClient.statObject(
                StatObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
        );
    }
}
