package com.ecotel.product_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductInventoryItem {
    String productId;
    String name;
    String categoryId;
    String categoryName;
    String unit;
    List<WarehouseStock> warehouses;
    BigDecimal totalQuantity;
}
