package com.ecotel.warehouse_service.service.external;

import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.shared_library.service.TokenService;
import com.ecotel.warehouse_service.dto.request.WarehouseConfigRequest;
import com.ecotel.warehouse_service.dto.request.WarehouseConfigUpdateRequest;
import com.ecotel.warehouse_service.dto.response.WarehouseConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarehouseConfigService {
    private final WebClient.Builder webClientBuilder;

    @Value("${external.warehouse-config-service.url}")
    private String warehouseConfigServiceUrl;

    // GET WAREHOUS CONFIG
    public WarehouseConfigResponse get(Long warehouseConfigId) {
        return webClientBuilder.build().get()
                .uri(warehouseConfigServiceUrl + "/warehouse-config/{warehouseConfigId}", warehouseConfigId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<WarehouseConfigResponse>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }

    // CREATE WAREHOUS CONFIG
    public WarehouseConfigResponse create(WarehouseConfigRequest request) {
        return webClientBuilder.build().post()
                .uri(warehouseConfigServiceUrl + "/warehouse-config")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<WarehouseConfigResponse>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }

    // UPDATE WAREHOUS CONFIG
    public WarehouseConfigResponse update(WarehouseConfigUpdateRequest request) {
        System.out.println("Warehouse config update request: " + request);
        return webClientBuilder.build().put()
                .uri(warehouseConfigServiceUrl + "/warehouse-config")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<WarehouseConfigResponse>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }
}