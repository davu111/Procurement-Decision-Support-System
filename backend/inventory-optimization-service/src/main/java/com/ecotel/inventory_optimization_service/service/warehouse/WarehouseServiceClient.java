package com.ecotel.inventory_optimization_service.service.warehouse;

import com.ecotel.inventory_optimization_service.dto.response.warehouse.FullWarehouseResponse;
import com.ecotel.shared_library.dto.response.ApiResponse;
import com.ecotel.shared_library.service.TokenService;
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

    // GET WAREHOUSE FULL INFO BY CONFIG ID
    public FullWarehouseResponse getFullWarehouseInfoByConfigId(Long configId) {
        try {
            log.info("Fetching full warehouse info by configId: {}", configId);
            return webClientBuilder.build().get()
                    .uri(warehouseServiceUrl + "/warehouses/full-info-config/{configId}", configId)
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

    // GET CONFIG ID BY PRODUCT ID
    public Long getConfigIdByProductId(String productId) {
        try {
            log.info("Fetching configId by productId: {}", productId);
            return webClientBuilder.build().get()
                    .uri(warehouseServiceUrl + "/warehouses/config-product-id/{productId}", productId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<com.ecotel.shared_library.dto.response.ApiResponse<Long>>() {
                    })
                    .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                    .block();
        } catch (Exception e) {
            log.error("Error fetching configId by productId: {}, URL: {}", productId, warehouseServiceUrl + "/warehouses/config-product-id/{productId}" + productId, e);
            throw e;
        }
    }

    // GET REAL-TIME QUANTITY BY PRODUCT ID FROM WAREHOUSE-SERVICE
    public java.math.BigDecimal getInventoryQuantityByProductId(String productId) {
        try {
            log.info("Fetching real-time inventory quantity by productId: {}", productId);
            return webClientBuilder.build().get()
                    .uri(warehouseServiceUrl + "/inventories/quantity/{productId}", productId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<com.ecotel.shared_library.dto.response.ApiResponse<java.math.BigDecimal>>() {
                    })
                    .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                    .block();
        } catch (Exception e) {
            log.error("Error fetching inventory quantity by productId: {}, URL: {}", productId, warehouseServiceUrl + "/inventories/quantity/" + productId, e);
            return null;
        }
    }
}
