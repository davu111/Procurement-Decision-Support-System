package com.ecotel.transaction_service.service.external;

import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final WebClient.Builder webClientBuilder;

    @Value("${external.supplier-service.url}")
    private String supplierServiceUrl;

    // GET MAP PRODUCT, QUANTITY
    public Map<String, BigDecimal> getMapProductUnit(List<String> productIds) {
        return webClientBuilder.build().post()
                .uri(supplierServiceUrl + "/supplier-products/get-map-product-unit")
                .bodyValue(productIds)
//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Map<String, BigDecimal>>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }
}
