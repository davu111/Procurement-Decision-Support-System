package com.ecotel.plan_service.service;

import com.ecotel.plan_service.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class DriverService {
    private final WebClient webClient;

    @Value("${external.driver-service.url}")
    private String driverServiceUrl;

    // GET DRIVER NAME BY ID
    public String getDriverNameById(String driverId) {
        return webClient.get()
                .uri(driverServiceUrl + "/drivers/name/{driverId}", driverId)
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
