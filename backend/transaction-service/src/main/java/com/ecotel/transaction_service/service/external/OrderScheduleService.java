package com.ecotel.transaction_service.service.external;

import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WebClient.Builder webClientBuilder;

    @Value("${external.warehouse-service.url}")
    private String warehouseServiceUrl;

    // GET WAREHOUSE NAME BY ID
    public String getWarehouseNameById(String warehouseId) {
        return webClientBuilder.build().get()
                .uri(warehouseServiceUrl + "/warehouses/name/{warehouseId}", warehouseId)

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