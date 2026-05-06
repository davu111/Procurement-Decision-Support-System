package com.ecotel.warehouse_service.service.external;

import com.ecotel.shared_library.dto.response.ApiResponse;
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

    // CREATE WAREHOUS CONFIG
    public WarehouseConfigResponse create(WarehouseConfigRequest request) {
        return webClientBuilder.build().post()
                .uri(warehouseConfigServiceUrl + "/warehouse-config")
                .bodyValue(request)
//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
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
//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<WarehouseConfigResponse>>() {
                })
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();
    }
}