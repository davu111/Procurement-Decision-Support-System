package com.ecotel.shared_library.service;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.shared_library.dto.response.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
public class ProductService {
    private final WebClient webClient;
    private final String productServiceUrl;

    // GET PRODUCT BY ID
    public ProductResponse getProductById(String id) {
        return webClient.get()
                .uri(productServiceUrl + "/products/{id}", id)
//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<ProductResponse>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }

    // GET PRODUCT NAME BY ID
    public Map<String, String> getProductNameByIds(List<String> productIds) {
        return webClient.post()
                .uri(productServiceUrl + "/products/names")
                .bodyValue(productIds)  // ✅ Gửi danh sách productIds trong body

//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Map<String, String>>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }

    // GET PRODUCT ACTIVE
    public List<ProductResponse> getActiveTrue() {
        return webClient.get()
                .uri(productServiceUrl + "/products/get-active")

//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<ProductResponse>>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }

    // GET MAP<ID, PRODUCT RESPONSE> BY IDS
    public Map<String, ProductResponse> getProductMapByIds(List<String> productIds) {
        return webClient.post()
                .uri(productServiceUrl + "/products/get-map-products")
                .bodyValue(productIds)  // ✅ Gửi danh sách productIds trong body

//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<Map<String, ProductResponse>>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }
}