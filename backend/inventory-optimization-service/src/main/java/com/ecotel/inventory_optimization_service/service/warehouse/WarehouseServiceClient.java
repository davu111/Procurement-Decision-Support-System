package com.ecotel.inventory_optimization_service.service.warehouse;

import com.ecotel.inventory_optimization_service.dto.response.warehouse.FullWarehouseResponse;
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
public class WarehouseServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${external.warehouse-service.url}")
    private String warehouseServiceUrl;

    public FullWarehouseResponse getFullWarehouseInfoByConfigId(Long configId) {
        try {
            log.info("Fetching full warehouse info by configId: {}", configId);
            return webClientBuilder.build().get()
                    .uri(warehouseServiceUrl + "/warehouses/full-info-config/{configId}", configId)
    //                .headers(headers -> {
    //                    assert tokenValue != null;
    //                    headers.setBearerAuth(tokenValue);
    //                }) // ✅ Gắn Authorization header
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<com.ecotel.shared_library.dto.response.ApiResponse<FullWarehouseResponse>>() {
                    })
                    .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                    .block();
        } catch (Exception e) {
            log.error("Error fetching warehouse info for configId: {}, URL: {}", configId, warehouseServiceUrl + "/warehouses/full-info-config/" + configId, e);
            throw e;
        }
    }
}
