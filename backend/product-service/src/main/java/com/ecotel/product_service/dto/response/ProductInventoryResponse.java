package com.ecotel.product_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductInventoryResponse {
    List<ProductInventoryItem> items;
    Integer totalItems;
    BigDecimal totalStock;

    public static ProductInventoryResponse empty() {
        return ProductInventoryResponse.builder()
                .items(Collections.emptyList())
                .totalItems(0)
                .totalStock(BigDecimal.ZERO)
                .build();
    }
}
