package com.ecotel.warehouse_service.service.external;

import com.ecotel.shared_library.dto.response.ApiResponse;
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
public class OrderScheduleService {
    private final WebClient.Builder webClientBuilder;

    @Value("${external.order-schedule-service.url}")
    private String orderScheduleServiceUrl;

    // GET MAP PRODUCT, QUANTITY
    public Map<String, BigDecimal> getLastOrder(List<String> productIds) {
        return webClientBuilder.build().post()
                .uri(orderScheduleServiceUrl + "/order-schedules/last-order?date=" + LocalDate.now())
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