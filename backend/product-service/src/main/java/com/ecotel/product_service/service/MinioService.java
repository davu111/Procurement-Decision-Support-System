package com.ecotel.product_service.service;

import com.ecotel.product_service.dto.response.ProductImageResponse;
import com.ecotel.product_service.model.ProductImage;
import com.ecotel.product_service.repository.ProductImageRepository;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MinioService {
    private final ProductImageService service;
    private final MinioClient minioClient;
    private final ProductImageRepository productImageRepository;

    public MinioService(ProductImageService service, ProductImageRepository productImageRepository) {
        this.productImageRepository = productImageRepository;
        this.service = service;
        this.minioClient = MinioClient.builder()
                .endpoint("http://localhost:8901")
                .credentials("admin", "admin12345")
                .build();
    }

    public String generatePresignedUrl(String bucketName, String objectName) {
//        System.out.println("MinIO Endpoint: " + minioClient.get()); // Thêm dòng này
        System.out.println("Generating presigned URL for bucket: " + bucketName + ", object: " + objectName);

        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(1, TimeUnit.HOURS)
                            .build()
            );
        } catch (Exception e) {
            e.printStackTrace(); // In chi tiết lỗi
            throw new RuntimeException("Error generating presigned URL", e);
        }
    }

    public String getImageUrl(String productId) {
        ProductImageResponse image = service.getByProductId(productId);
        System.out.println(image);
        return generatePresignedUrl(image.getBucketName(), image.getObjectName());
    }
    public Map<String, String> getImageUrls(List<String> productIds) {
        List<ProductImageResponse> images = service.getByProductIds(productIds);

        return images.stream()
                .collect(Collectors.toMap(
                        ProductImageResponse::getProductId,
                        img -> generatePresignedUrl(img.getBucketName(), img.getObjectName())
                ));
    }
    // Upload image to Minio
    public void uploadProductImage(String productId, MultipartFile file) {
        try {
            // Kiểm tra xem product đã có ảnh chưa
            ProductImage existingImage = productImageRepository.findByProductId(productId).orElse(null);

            String bucketName = "product";
            String objectName = file.getOriginalFilename();

            // Nếu đã có ảnh cũ, xóa ảnh cũ trên MinIO
            if (existingImage != null) {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(existingImage.getBucketName())
                                .object(existingImage.getObjectName())
                                .build()
                );
            }

            // Upload ảnh mới
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            // Cập nhật hoặc tạo mới ProductImage
            ProductImage productImage;
            if (existingImage != null) {
                existingImage.setBucketName(bucketName);
                existingImage.setObjectName(objectName);
                existingImage.setContentType(file.getContentType());
                existingImage.setUpdatedAt(LocalDateTime.now());
                productImage = existingImage;
            } else {
                productImage = ProductImage.builder()
                        .productId(productId)
                        .bucketName(bucketName)
                        .objectName(objectName)
                        .contentType(file.getContentType())
                        .createdAt(LocalDateTime.now())
                        .build();
            }

            productImageRepository.save(productImage);

        } catch (Exception e) {
            log.error("Error uploading image", e);
            throw new RuntimeException("Failed to upload image", e);
        }
    }
}

