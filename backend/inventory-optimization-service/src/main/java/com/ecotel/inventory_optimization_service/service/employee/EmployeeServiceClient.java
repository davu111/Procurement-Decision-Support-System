package com.ecotel.inventory_optimization_service.service.employee;

import com.ecotel.shared_library.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeeServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${external.employee-service.url}")
    private String employeeServiceUrl;

    // GET FULL NAME
    public String getFullNameById(String userId) {
        try {
            log.info("Fetching configId by userId: {}", userId);
            return webClientBuilder.build().get()
                    .uri(employeeServiceUrl + "/employees/full-name/{userId}", userId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<String>>() {
                    })
                    .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                    .block();
        } catch (Exception e) {
            log.error("Error fetching configId by userId: {}, URL: {}", userId, employeeServiceUrl + "/employees/full-name/{userId}" + userId, e);
            throw e;
        }
    }
}
