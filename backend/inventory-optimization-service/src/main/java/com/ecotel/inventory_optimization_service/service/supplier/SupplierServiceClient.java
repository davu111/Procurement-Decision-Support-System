package com.ecotel.inventory_optimization_service.service.supplier;

import com.ecotel.inventory_optimization_service.dto.request.supplier.SupplierProductData;
import com.ecotel.inventory_optimization_service.dto.response.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Optional;

/**
 * REST client gọi sang Supplier Service.
 *
 * Fallback strategy:
 *   Nếu Supplier Service không phản hồi → trả về Optional.empty()
 *   → Caller sẽ dùng snapshot từ kỳ kế hoạch trước
 */
@Slf4j
@Component
public class SupplierServiceClient {

    private final RestClient restClient;

    public SupplierServiceClient(
            @Value("${supplier.url}") String supplierServiceUrl,
            RestClient.Builder builder) {
        this.restClient = builder
                .baseUrl(supplierServiceUrl)
                .build();
    }

    public Optional<SupplierProductData> getByProductId(Long productId) {
        try {
            ApiResponse<SupplierProductData> response = restClient.get()
                    .uri("/api/supplier-products/by-product/{id}", productId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            return Optional.ofNullable(response)
                    .map(ApiResponse::getData);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Không tìm thấy NCC cho productId={}", productId);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Không kết nối được Supplier Service: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
