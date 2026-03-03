package com.ecotel.plan_service.service;

import com.ecotel.plan_service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final WebClient webClient;

    @Value("${external.product-service.url}")
    private String productServiceUrl;

    // GET EMPLOYEE NAME BY ID
    public String getProductNameById(String productId) {
        return webClient.get()
                .uri(productServiceUrl + "/products/name/{productId}", productId)

//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<String>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }
}
